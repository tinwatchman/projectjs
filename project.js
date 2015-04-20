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
    };

    return ProjectJs;

})();
/*
var ProjectRunner = require('./lib/runner');

var runner = new ProjectRunner();

var path = process.cwd() + "/example/";

runner.loadAndRun(path);
*/

// var ProjectJsCompiler = require('./lib/compiler');
// var ProjectJsParser = require('./lib/parser');
// var compiler = new ProjectJsCompiler();
// var parser = new ProjectJsParser();

// var projectRoot = process.cwd() + "/example",
//     projectFile = projectRoot + "/project.json",
//     buildDir = "./build";

// var registry = parser.loadRegistry(projectFile);
// var projectInfo = require(projectFile);
// compiler.buildProject(registry, projectRoot, buildDir, projectInfo.start);

// var ProjectJsFileUtil = require('./lib/file');
// var fileUtil = new ProjectJsFileUtil();
// var map = fileUtil.mapDirectory(process.cwd() + "/example", {
//     'excludePaths': [ process.cwd() + '/example/build', process.cwd() + "/example/libs" ], 
//     'excludeFiles': [ ".DS_Store", "project.json" ]
// });
// console.log(map);
