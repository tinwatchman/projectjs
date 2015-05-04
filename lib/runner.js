module.exports = (function() {
    var ProjectJsCompiler = require('./compiler');
    var util = require('./util');
    var _ = require('underscore');
    var fs = require('fs');
    var path = require('path');

    var ProjectJsRunner = function() {
        var self = this,
            registry = null,
            tmpFiles = null;

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

        var onEndRun = function() {
            console.log("ProjectJsRunner onEndRun");
            _.each(tmpFiles, function(tmpFile) {
                console.log("Unlinking " + tmpFile);
                fs.unlinkSync(tmpFile);
            });
        };

        this.run = function(project, registryObj) {
            if (!project.hasStart()) {
                throw new Error("ERROR: Start point not set");
            }

            registry = registryObj;
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
