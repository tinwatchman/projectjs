module.exports = (function() {

    var ProjectJs = function() {

        var findProjectRoot = function() {
            var findup = require('findup-sync'),
                path = require('path'),
                _ = require('underscore');

            var projectPath = findup("project.json");
            if (_.isUndefined(projectPath) || _.isNull(projectPath)) {
                throw new Error("Could not find a project.json file or under the current directory!");
            }
            return {
                'file': projectPath,
                'dir': path.dirname(projectPath)
            };
        };

        var writeProjectFile = function(projectFile, filePath) {
            var fs = require('fs');
            var json = projectFile.toJSON();
            fs.writeFileSync(filePath, json, {'encoding':'utf8'});
        };

        this.getVersion = function() {
            var ownVersion = require('own-version');
            return ownVersion.sync();
        };

        this.init = function(options) {
            var fs = require('fs-extra'),
                path = require('path'),
                _ = require('underscore'),
                ProjectJsFactory = require('./lib/factory'),
                util = require('./lib/util');

            if (!_.has(options, 'namespace')) {
                throw new Error("Base namespace is required!");
                return;
            }

            var root = _.has(options, "root") ? options['root'] : process.cwd(),
                args = {
                    'baseNs': _.has(options, 'namespace') ? options['namespace'] : undefined,
                },
                factory = new ProjectJsFactory();

            if (_.has(options, 'src') && !_.isEmpty(options['src'])) {
                if (path.isAbsolute(options['src'])) {
                    args['srcDir'] = options['src'];
                } else {
                    args['srcDir'] = './' + util.convertBackSlashes(options['src']);
                }
                // make sure given source directory exists
                fs.ensureDirSync(path.join(root, args['srcDir']));
            }
            if (_.has(options, 'build') && !_.isEmpty(options['build'])) {
                if (path.isAbsolute(options['build'])) {
                    args['buildDir'] = options['build'];
                } else {
                    args['buildDir'] = './' + util.convertBackSlashes(options['build']);
                }
                // make sure given build directory exists
                fs.ensureDirSync(path.join(root, args['buildDir']));
            }

            var json = factory.getProjectJson(args),
                filePath = path.join(root, "project.json");

            fs.writeFileSync(filePath, json, {'encoding':'utf8'});

            console.log("Project created!");
        };

        this.createNewClass = function(options) {
            var _ = require('underscore'),
                ProjectJsParser = require('./lib/parser'),
                ProjectJsFactory = require('./lib/factory');

            if (!_.has(options, "name")) {
                throw new Error("Class name is required!");
            }

            var root = findProjectRoot(),
                parser = new ProjectJsParser(),
                projectFile = parser.loadProjectFile(root.file),
                factory = new ProjectJsFactory(),
                classDir = _.has(options, "path") ? options["path"] : process.cwd();
            
            var classInfo = factory.createNewClass(options.name, classDir, projectFile);
            projectFile.addClass(classInfo.name, classInfo.path);
            writeProjectFile(projectFile, root.file);
            console.log("Class %s created!", classInfo.name);
        };

        /**
         * Removes a class from the project and deletes the class file.
         * @param  {String}   name     Name of class
         * @param  {Function} callback Callback function. Optional.
         * @return {void}
         */
        this.removeClass = function(options) {
            var fs = require('fs-extra'),
                path = require('path'),
                _ = require('underscore'),
                ProjectJsParser = require('./lib/parser');

            var hasName = (_.has(options, "name") && !_.isEmpty(options.name)),
                hasCallback = (_.has(options, 'callback') && _.isFunction(options.callback));

            if (!hasName && hasCallback) {
                options.callback.call(null, new Error("Class name is required!"), null);
                return;
            } else if (!hasName) {
                throw new Error("Class name is required!");
            }

            var className = options.name,
                root = findProjectRoot(),
                parser = new ProjectJsParser(),
                projectFile = parser.loadProjectFile(root.file),
                registry = parser.createRegistry(projectFile);

            if (registry.has(className)) {
                var classFilePath = registry.resolve(className),
                    filePath = path.join(root.dir, classFilePath) + ".js";
                if (!_.has(options, 'retainFile') || options['retainFile'] === false) {
                    fs.removeSync(filePath);
                }
                projectFile.removeClass(className);
                writeProjectFile(projectFile, root.file);
                if (hasCallback) {
                    options.callback.call(null, null, {'class': className, 'file': filePath, 'success': true});
                }

            } else if (hasCallback) {
                options.callback.call(null, new Error("Class not found in registry!"), {'success':false});
                return;
            } else {
                throw new Error("Class not found in registry!");
            }
        };

        this.addDependency = function(options) {
            var ProjectJsParser = require('./lib/parser'),
                _ = require('underscore');

            if (!_.has(options, "name") || _.isEmpty(options['name'])) {
                throw new Error("Dependency name is required!");
            } else if (!_.has(options, "path") || _.isEmpty(options['path'])) {
                throw new Error("Path to dependency is required!");
            }

            var root = findProjectRoot(),
                parser = new ProjectJsParser(),
                projectFile = parser.loadProjectFile(root.file);

            // TODO: check to make sure dependency exists
            
            projectFile.addDependency(options['name'], options['path']);
            writeProjectFile(projectFile, root.file);
            console.log("Dependency %s added", options['name']);
        };

        this.addAlias = function(options) {
            var ProjectJsParser = require('./lib/parser'),
                _ = require('underscore');

            if (!_.has(options, "alias") || _.isEmpty(options['alias'])) {
                throw new Error("Alias is required!");
            } else if (!_.has(options, "class") || _.isEmpty(options['class'])) {
                throw new Error("Class is required!");
            }

            var root = findProjectRoot(),
                parser = new ProjectJsParser(),
                projectFile = parser.loadProjectFile(root.file);

            // TODO: check to make sure class path exists / resolve classes relative to cwd
            
            projectFile.addAlias(options['alias'], options['class']);
            writeProjectFile(projectFile, root.file);
            console.log("Alias added");
        };

        this.removeAlias = function(options) {
            var ProjectJsParser = require('./lib/parser'),
                _ = require('underscore');

            var hasAlias = (_.has(options, "alias") && !_.isEmpty(options.alias)),
                hasCallback = (_.has(options, 'callback') && _.isFunction(options.callback));

            if (!hasAlias && hasCallback) {
                options.callback.call(null, new Error("Alias is required!"), null);
            } else if (!hasAlias) {
                throw new Error("Alias is required!");
            }

            var root = findProjectRoot(),
                parser = new ProjectJsParser(),
                projectFile = parser.loadProjectFile(root.file);

            if (projectFile.hasAlias(options.alias)) {
                projectFile.removeAlias(options.alias);
                writeProjectFile(projectFile, root.file);
                if (hasCallback) {
                    options.callback.call(null, null, {'success': true});
                }
            } else if (hasCallback) {
                options.callback.call(null, new Error("Alias not registered!"), {'success': false});
            } else {
                throw new Error("Alias not registered!");
            }
        };

        this.setStartScript = function(options) {
            var _ = require('underscore'),
                ProjectJsParser = require('./lib/parser');

            if (!_.has(options, "script") || _.isEmpty(options.script)) {
                throw new Error("Script parameter is required");
            }

            var root = findProjectRoot(),
                parser = new ProjectJsParser(),
                projectFile = parser.loadProjectFile(root.file);

            // TODO: add more verification / check to make sure file exists / is a file path
            
            projectFile.setStart(options.script);
            writeProjectFile(projectFile, root.file);
            console.log("Start point set");
        };

        this.setStartClass = function(options) {
            var _ = require('underscore'),
                ProjectJsParser = require('./lib/parser');

            if (!_.has(options, "class") || !_.has(options, "method")) {
                throw new Error("Required parameter missing");
            }

            var root = findProjectRoot(),
                parser = new ProjectJsParser(),
                projectFile = parser.loadProjectFile(root.file);
                //registry = parser.createRegistry(projectFile);

            // TODO: add more verification / check to make sure class
            // exists in the registry / has the specified method, etc.
            
            if (!_.has(options, "output") || _.isEmpty(options.output)) {
                // default output to "start.js"
                options.output = "./start.js";
            }

            projectFile.setStart({
                "class": options["class"],
                "method": options["method"],
                "output": options["output"]
            });
            writeProjectFile(projectFile, root.file);
            console.log("Start point set");
        };

        this.build = function() {
            var ProjectJsParser = require('./lib/parser'),
                ProjectJsCompiler = require('./lib/compiler');

            var root = findProjectRoot(),
                parser = new ProjectJsParser(),
                projectFile = parser.loadProjectFile(root.file),
                registry = parser.createRegistry(projectFile);

            var compiler = new ProjectJsCompiler();
            compiler.buildProject(projectFile, registry);
            console.log("build complete");
        };

        this.run = function() {
            var ProjectJsParser = require('./lib/parser'),
                ProjectJsRunner = require('./lib/runner');

            var root = findProjectRoot(),
                parser = new ProjectJsParser(),
                projectFile = parser.loadProjectFile(root.file),
                registry = parser.createRegistry(projectFile);

            var runner = new ProjectJsRunner();
            runner.run(root.dir, projectFile, registry);
        };

    };

    return ProjectJs;

})();

