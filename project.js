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

        this.getVersion = function() {
            var ownVersion = require('own-version');
            return ownVersion.sync();
        };

        this.buildProject = function() {
            var ProjectJsParser = require('./lib/parser')
                ProjectJsCompiler = require('./lib/compiler');

            var root = findProjectRoot(),
                parser = new ProjectJsParser(),
                projectFile = parser.loadProjectFile(root.file),
                registry = parser.createRegistry(projectFile.getNamespace());

            // determine build directory, if we can
            var buildDir = null;
            if (projectFile.hasBuild()) {
                buildDir = projectFile.getBuild();
            }

            // determine start info
            var startInfo = null;
            if (projectFile.hasStart()) {
                startInfo = projectFile.getStart();
            }

            var compiler = new ProjectJsCompiler();
            compiler.buildProject(registry, root.dir, buildDir, startInfo);
            console.log("build complete");
        };

        this.init = function(options) {
            var fs = require('fs'),
                path = require('path'),
                ownVersion = require('own-version'),
                _ = require('underscore'),
                ProjectJsFile = require('./lib/projectfile');

            var root = _.has(options, "root") ? options['root'] : process.cwd(),
                baseNs = _.has(options, 'namespace') ? options['namespace'] : "project",
                buildDir = _.has(options, 'build') ? options['build'] : null,
                currentVersion = ownVersion.sync();

            var project = new ProjectJsFile({
                "namespace": {
                    "base": baseNs,
                    "map": {},
                    "dependencies": {},
                    "aliases": {}
                },
                "build": "",
                "start": "",
                "schema": {
                    "name": "projectjs",
                    "version": currentVersion
                }
            });
            if (buildDir !== null) {
                project.setBuild('./' + buildDir);
            }

            var filePath = path.join(root, "project.json"),
                json = project.toJSON();
            
            fs = fs.writeFileSync(filePath, json, {'encoding':'utf8'});
            console.log("Project created");
        };
    };

    return ProjectJs;

})();

