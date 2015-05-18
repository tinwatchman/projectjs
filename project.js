module.exports = (function() {

    var ProjectJs = function() {

        var findProjectRoot = function() {
            var findup = require('findup-sync'),
                path = require('path'),
                _ = require('underscore');

            var projectPath = findup("project.json");
            if (_.isUndefined(projectPath) || _.isNull(projectPath)) {
                throw new Error("Could not find a project.json file within or under the current directory!");
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

        var isCallbackSet = function(options) {
            var _ = require('underscore');
            return (_.has(options, 'callback') && _.isFunction(options.callback));
        };

        /**
         * Creates a new project in the given or working directory.
         * @param  {String}   namespace The project's base namespace. Required.
         * @param  {String}   root      Root path of the project. Optional.
         * @param  {String}   src       Name of or path to source folder
         * @param  {String}   build     Name of or path to build folder
         * @param  {Function} callback  Callback function. Optional.
         * @return {void}
         */
        this.init = function(options) {
            var fs = require('fs-extra'),
                path = require('path'),
                _ = require('underscore'),
                ProjectJsFactory = require('./lib/factory'),
                util = require('./lib/util');

            var hasNs = (_.has(options, 'namespace') && !_.isEmpty(options['namespace'])),
                hasCallback = isCallbackSet(options);

            if (!hasNs && hasCallback) {
                options.callback.call(null, new Error("Base namespace is required!"));
                return;
            } else if (!hasNs) {
                throw new Error("Base namespace is required!");
            }

            // check root to see if it already has a project in it
            var root = _.has(options, "root") ? options['root'] : process.cwd(),
                isProject = fs.existsSync(path.join(root, './project.json'));
            if (isProject && hasCallback) {
                options.callback.call(null, new Error("A project already exists in this directory"));
                return;
            } else if (isProject) {
                throw new Error("A project already exists in this directory");
            }

            // construct src and build folders
            var args = {
                    'baseNs': options['namespace']
                },
                factory = new ProjectJsFactory();
            if (_.has(options, 'src') && !_.isEmpty(options['src'])) {
                if (path.isAbsolute(options['src'])) {
                    var srcDirPath = path.relative(root, options['src']);
                    args['srcDir'] = util.convertBackSlashes(srcDirPath);
                } else {
                    args['srcDir'] = './' + util.convertBackSlashes(options['src']);
                }
                // make sure given source directory exists
                fs.ensureDirSync(path.join(root, args['srcDir']));
            }
            if (_.has(options, 'build') && !_.isEmpty(options['build'])) {
                if (path.isAbsolute(options['build'])) {
                    var buildDirPath = path.relative(root, options['build']);
                    args['buildDir'] = util.convertBackSlashes(buildDirPath);
                } else {
                    args['buildDir'] = './' + util.convertBackSlashes(options['build']);
                }
                // make sure given build directory exists
                fs.ensureDirSync(path.join(root, args['buildDir']));
            }

            // write project.json file
            var json = factory.getProjectJson(args),
                filePath = path.join(root, "project.json");

            fs.writeFileSync(filePath, json, {'encoding':'utf8'});

            if (hasCallback) {
                options.callback.call(null, null, {'success': true});
            }
        };

        /**
         * Creates and adds a new class to the project.
         * @param  {String}   name     Name of class to add
         * @param  {String}   path     File path to class. Optional.
         * @param  {Function} callback Callback function.
         * @return {void}
         */
        this.createClass = function(options) {
            var _ = require('underscore'),
                ProjectJsParser = require('./lib/parser'),
                ProjectJsFactory = require('./lib/factory');

            var hasName = (_.has(options, 'name') && !_.isEmpty(options.name)),
                hasCallback = isCallbackSet(options);

            if (!hasName && hasCallback) {
                options.callback.call(null, new Error("Class name is required!"));
                return;
            } else if (!hasName) {
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

            if (hasCallback) {
                options.callback.call(null, null, _.extend({'success':true}, classInfo));
            }
        };

        /**
         * Removes a class from the project and deletes the class file.
         * @param  {String}   name       Name of class
         * @param  {Boolean}  retainFile Whether to delete the class file or not. Optional.
         * @param  {Function} callback   Callback function. Optional.
         * @return {void}
         */
        this.removeClass = function(options) {
            var fs = require('fs-extra'),
                path = require('path'),
                _ = require('underscore'),
                ProjectJsParser = require('./lib/parser');

            var hasName = (_.has(options, "name") && !_.isEmpty(options.name)),
                hasCallback = isCallbackSet(options);

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

        /**
         * Adds a shorthand alias for the given class
         * @param {String}   alias     Alias
         * @param {String}   className Full name of class
         * @param {Function} callback  Callback function
         */
        this.addAlias = function(options) {
            var ProjectJsParser = require('./lib/parser'),
                _ = require('underscore');

            // check for required options
            var hasAlias = (_.has(options, "alias") && !_.isEmpty(options['alias'])),
                hasClassName = (_.has(options, "className") && !_.isEmpty(options['className'])),
                hasCallback = isCallbackSet(options);

            if (!hasAlias && hasCallback) {
                options.callback.call(null, new Error("Alias is required!"));
                return;
            } else if (!hasAlias) {
                throw new Error("Alias is required!");
            } else if (!hasClassName && hasCallback) {
                options.callback.call(null, new Error("Class name is required!"));
                return;
            } else if (!hasClassName) {
                throw new Error("Class name is required!");
            }

            var root = findProjectRoot(),
                parser = new ProjectJsParser(),
                projectFile = parser.loadProjectFile(root.file);

            // TODO: check to make sure class path exists / resolve classes relative to cwd
            
            projectFile.addAlias(options['alias'], options['class']);
            writeProjectFile(projectFile, root.file);
            
            if (hasCallback) {
                options.callback.call(null, null, {'success': true, 'alias': options['alias']});
            }
        };

        /**
         * Removes an existing alias from the project
         * @param  {String}   alias    Alias to remove
         * @param  {Function} callback Callback function
         */
        this.removeAlias = function(options) {
            var ProjectJsParser = require('./lib/parser'),
                _ = require('underscore');

            var hasAlias = (_.has(options, "alias") && !_.isEmpty(options.alias)),
                hasCallback = isCallbackSet(options);

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

        /**
         * Sets the project's start point to a particular script file
         * @param {String}   script   Path to script file
         * @param {Function} callback Callback function
         */
        this.setStartScript = function(options) {
            var _ = require('underscore'),
                ProjectJsParser = require('./lib/parser');

            var hasScript = (_.has(options, "script") && !_.isEmpty(options.script)),
                hasCallback = isCallbackSet(options);

            if (!hasScript && hasCallback) {
                options.callback.call(null, null, new Error("Script parameter is required"));
            } else if (!hasScript) {
                throw new Error("Script parameter is required");
            }

            var root = findProjectRoot(),
                parser = new ProjectJsParser(),
                projectFile = parser.loadProjectFile(root.file);

            // TODO: add more verification / check to make sure file exists / is a file path
            // TODO: also make sure script path is relative to src or root folder
            
            projectFile.setStart(options.script);
            writeProjectFile(projectFile, root.file);
            
            if (hasCallback) {
                options.callback.call(null, null, {'success': true, 'filePath': options.script});
            }
        };

        /**
         * Sets the project's start point to a particular class and method
         * @param {String}   className Name of starting class. Required.
         * @param {String}   method    Name of start method. Required.
         * @param {String}   output    Name or path of script to output on build
         * @param {Function} callback  Callback function
         */
        this.setStartClass = function(options) {
            var _ = require('underscore'),
                ProjectJsParser = require('./lib/parser');

            var hasClassName = (_.has(options, 'className') && !_.isEmpty(options.className)),
                hasMethod = (_.has(options, 'method') && !_.isEmpty(options.method)),
                hasCallback = isCallbackSet(options);

            if (!hasClassName && hasCallback) {
                options.callback.call(null, new Error("Class name is required"));
                return;
            } else if (!hasClassName) {
                throw new Error("Class name is required");
            } else if (!hasMethod && hasCallback) {
                options.callback.call(null, new Error("Method is required"));
                return;
            } else if (!hasMethod) {
                throw new Error("Method is required");
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
                "class": options["className"],
                "method": options["method"],
                "output": options["output"]
            });
            writeProjectFile(projectFile, root.file);
            
            if (hasCallback) {
                options.callback.call(null, null, {'success': true});
            }
        };

        /**
         * Builds a project.
         * @param  {String}   projectFile Path to project file to build. Optional.
         * @param  {Function} callback    Callback function
         */
        this.build = function(options) {
            var ProjectJsParser = require('./lib/parser'),
                ProjectJsCompiler = require('./lib/compiler'),
                _ = require('underscore');

            var parser = new ProjectJsParser(),
                projectFile,
                registry,
                hasCallback = isCallbackSet(options);

            if (_.has(options, 'projectFile') && !_.isEmpty(options.projectFile)) {
                try {
                    projectFile = parser.loadProjectFile(options.projectFile);
                    registry = parser.createRegistry(projectFile);
                } catch (e) {
                    if (hasCallback) {
                        options.callback.call(null, {
                            'message': "Unable to load project file",
                            'error': e
                        });
                    } else {
                        throw e;
                    }
                    return;
                }
            } else {
                var root = findProjectRoot();
                projectFile = parser.loadProjectFile(root.file);
                registry = parser.createRegistry(projectFile);
            }

            var compiler = new ProjectJsCompiler();
            compiler.buildProject(projectFile, registry);
            
            if (hasCallback) {
                options.callback.call(null, null, {'success': true});
            }
        };

        /**
         * Runs a project.
         * @param  {String}   projectFile Path to project file. Optional.
         * @param  {Function} callback    Callback function
         */
        this.run = function(options) {
            var fs = require('fs-extra'),
                path = require('path'),
                _ = require('underscore'),
                ProjectJsParser = require('./lib/parser'),
                ProjectJsRunner = require('./lib/runner');

            var hasRoot = (_.has(options, 'projectFile') && !_.isEmpty(options.projectFile)),
                hasCallback = isCallbackSet(options);

            var rootDir,
                parser = new ProjectJsParser(),
                projectFile,
                registry;

            // resolve project file paths
            try {
                if (hasRoot) {
                    var filePath;
                    try {
                        filePath = fs.realpathSync(options.projectFile);
                    } catch (notfound) {
                        filePath = fs.realpathSync("." + path.sep + options.projectFile);
                    }
                    rootDir = path.dirname(filePath);
                    projectFile = parser.loadProjectFile(filePath);
                    registry = parser.createRegistry(projectFile);
                } else {
                    var root = findProjectRoot();
                    rootDir = root.dir;
                    projectFile = parser.loadProjectFile(root.file);
                    registry = parser.createRegistry(projectFile);
                }
            } catch (e) {
                if (hasCallback) {
                    options.callback.call(null, {
                        'message': "Error resolving project file", 
                        'error': e
                    });
                    return;
                } else {
                    throw e;
                }
            }

            // run project
            var runner = new ProjectJsRunner();
            if (hasCallback) {
                runner.run(rootDir, projectFile, registry, options.callback);
            } else {
                runner.run(rootDir, projectFile, registry);
            }
        };

    };

    return ProjectJs;

})();

