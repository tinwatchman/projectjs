module.exports = (function() {
    var ProjectJsCompiler = require('./compiler');
    var util = require('./util');
    var _ = require('underscore');
    var fs = require('fs');
    var path = require('path');

    var ProjectJsRunner = function() {
        var self = this,
            registry = null,
            projectRoot = null,
            previousCwd = null,
            tmpFiles = null,
            isComplete = false;

        var useFunction = function(includeName) {
            var result = registry.resolve(includeName);
            if (result !== null && !_.isString(result) && _.isObject(result)) {
                // if we've gotten a package map back
                return _.map(result, function(classPath, className) {
                    return require(path.join(projectRoot, classPath));
                });
            } else if (result !== null) {
                return require(path.join(projectRoot, result));
            }
            throw new Error("ERROR: name " + includeName + " not found in project registry");
        };

        var onEndRun = function() {
            if (!isComplete) {
                _.each(tmpFiles, function(tmpFile) {
                    //console.log("Unlinking " + tmpFile);
                    fs.unlinkSync(tmpFile);
                });
                if (previousCwd !== null) {
                    //console.log("Changing cwd back to %s", previousCwd);
                    process.chdir(previousCwd);
                }
                isComplete = true;
            }
        };

        this.run = function(projectDir, project, registryObj) {
            if (!project.hasStart()) {
                throw new Error("ERROR: Start point not set");
            }

            registry = registryObj;
            projectRoot = projectDir;
            var compiler = new ProjectJsCompiler();

            // compile project
            tmpFiles = compiler.compileProject(project, registry);

            // prep for run
            registry.isAddingCompileSuffix(true);
            global.use = useFunction;

            // add exit listeners
            process.on('exit', function() {
                onEndRun();
            });
            process.on('SIGINT', function(code) {
                onEndRun();
                process.exit(code);
            });
            process.on('SIGTERM', function(code) {
                onEndRun();
                process.exit(code);
            });
            process.on('SIGBREAK', function(code) {
                onEndRun();
                process.exit(code);
            });
            process.on('SIGHUP', function(code) {
                onEndRun();
                process.exit(code);
            });

            // temporarily set cwd to project root
            if (process.cwd() !== projectRoot) {
                previousCwd = process.cwd();
                process.chdir(projectRoot);
            };

            // get start point
            var start = project.getStart();
            if (!_.isEmpty(start) && _.isString(start)) {
                // if we're just provided with the filepath to a start script...
                require(start);
            } else if (_.isObject(start) && _.has(start, 'class') &&
                        _.has(start, 'method')) {
                // if we have a start class and method
                var StartClass = useFunction(start['class']),
                    startObj = new StartClass();
                if (_.has(start, "arguments")) {
                    startObj[start['method']].call(startObj, start["arguments"]);
                } else {
                    startObj[start['method']].apply(startObj, []);
                }
            } else {
                throw new Error("ERROR: Unable to read project start point");
            }
        };
    };

    return ProjectJsRunner;

})();
