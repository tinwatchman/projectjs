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
                ownVersion = require('own-version'),
                _ = require('underscore'),
                ProjectJsFile = require('./lib/projectfile'),
                util = require('./lib/util');

            var root = _.has(options, "root") ? options['root'] : process.cwd(),
                baseNs = _.has(options, 'namespace') ? options['namespace'] : "project",
                srcDir = _.has(options, 'src') ? options['src'] : null,
                buildDir = _.has(options, 'build') ? options['build'] : null,
                currentVersion = ownVersion.sync();

            var project = new ProjectJsFile({
                "data": {
                    "namespace": {
                        "base": baseNs,
                        "map": {},
                        "dependencies": {},
                        "aliases": {}
                    },
                    "srcDir": "",
                    "buildDir": "",
                    "start": "",
                    "schema": {
                        "name": "projectjs",
                        "version": currentVersion
                    }
                },
                "rootDir": root
            });
            if (srcDir !== null) {
                project.setSrcDir('./' + util.convertBackSlashes(srcDir));
                fs.ensureDirSync(path.join(root, srcDir));
            }
            if (buildDir !== null) {
                project.setBuildDir('./' + util.convertBackSlashes(buildDir));
                fs.ensureDirSync(path.join(root, buildDir));
            }

            var filePath = path.join(root, "project.json");
            writeProjectFile(project, filePath);
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

