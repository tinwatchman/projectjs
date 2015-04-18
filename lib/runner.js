module.exports = (function() {
    var ProjectRegistry = require('./registry');
    var ProjectCompiler = require('./compiler');
    var util = require('./util');
    var _ = require('underscore');
    var fs = require('fs');
    var path = require('path');

    var ProjectRunner = function() {
        var registry = null;

        var useFunction = function(includeName) {
            var result = registry.resolve(includeName);
            if (result !== null && !_.isString(result) && _.isObject(result)) {
                // if we've gotten a package map back
                return _.map(result, function(classPath, className) {
                    return require(classPath);
                });
            } else if (result !== null) {
                return require(result);
            }
            throw new Error("ERROR: name " + includeName + " not found in project registry");
        };

        var loadProjectFile = function(projectDir) {
            var projectInfo = JSON.parse(fs.readFileSync(path.join(projectDir, './project.json')));
            // check the schema, just in case
            if (!_.has(projectInfo, "schema") || projectInfo.schema.name !== "project.js") {
                throw new Error("ERROR: this does not appear to be a project.js project");
            }
            return projectInfo;  
        };

        var loadRegistry = function(projectDir, projectInfo) {
            var ns = projectInfo.namespace.base;
            registry = new ProjectRegistry({
                baseNamespace: ns
            });

            // get project directories
            var dirTokens = {};
            _.each(projectInfo.dirs, function(value, key){
                dirTokens[key] = path.join(projectDir, value);
            });

            var packageMap = {};

            var processNamePath = function(value, key) {
                // check to make sure the base namespace is in there
                var name,
                    filePath,
                    packageName,
                    isDirTokenFound = false;

                // check to make sure the name contains the base namespace
                /* if (key.indexOf(ns) !== 0 && key[0] === '.') {
                    name = ns + key;
                } else if (key.indexOf(ns) !== 0) {
                    name = ns + '.' + key;
                } else {
                    name = key;
                } */

                name = key;

                // process the filepath
                if (path.isAbsolute(value)) {
                    filePath = value;
                } else {
                    _.each(dirTokens, function(dir, token){
                        if (!isDirTokenFound && value.indexOf(token) > -1) {
                            filePath = path.normalize(value.replace(token, dir));
                            isDirTokenFound = true;
                        }
                    });
                    if (!isDirTokenFound) {
                        // then just add it to the project path
                        filePath = path.join(projectDir, value);
                    }
                }

                // record the package name
                packageName = util.getPackage(name);
                if (packageName !== null && _.has(packageMap, packageName)) {
                    packageMap[packageName].push(name);
                } else if (packageName !== null) {
                    packageMap[packageName] = [ name ];
                }

                // add to registry
                registry.add(name, filePath);
            };

            _.each(projectInfo.namespace.map, processNamePath);
            _.each(projectInfo.namespace.dependencies, processNamePath);

            // now register the packages
            _.each(packageMap, function(pkgClassList, pkgName) {
                registry.add(pkgName + '.*', pkgClassList);
            });
        };

        this.loadAndRun = function(projectDir) {
            var projectInfo = loadProjectFile(projectDir);

            if (!_.has(projectInfo, 'start')) {
                throw new Error("ERROR: can't run project! Start point has not been defined!");
            }

            loadRegistry(projectDir, projectInfo);

            global.use = useFunction;

            if (_.isString(projectInfo.start) && !_.isEmpty(projectInfo.start)) {
                // if we're just provided with a filepath, easy enough
                require(projectInfo.start);
            } else if (_.isObject(projectInfo.start) && _.has(projectInfo.start, 'class') && 
                        _.has(projectInfo.start, 'method')) {
                // then here's where things get complicated
                // first, let's get out the class path
                var startClassName = projectInfo.start['class'];
                var startClassPath = registry.resolve(startClassName);
                if (startClassPath === null) {
                    throw new Error("ERROR: Unable to resolve starting class!");
                }
                // if that's valid, then let's get 
                var compiler = new ProjectCompiler();
                var tmpFile = compiler.compileClassFile(startClassName, startClassPath);
                // add listener to process, delete the temp file once we've exited
                process.on('exit', function(code) {
                    console.log("Deleting file " + tmpFile);
                    fs.unlinkSync(tmpFile);
                });
                // get class and run
                var StartClass = require(tmpFile);
                var startObj = new StartClass();
                startObj[projectInfo.start.method].apply(startObj, []);
            } else {
                throw new Error("ERROR: unrecognized start point value");
            }
        };
    };

    return ProjectRunner;

})();
