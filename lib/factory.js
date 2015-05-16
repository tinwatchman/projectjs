
module.exports = (function() {
    var fs = require('fs-extra');
    var path = require('path');
    var Mustache = require('mustache');
    var ownVersion = require('own-version');
    var _ = require('underscore');
    var util = require('./util');

    var ProjectJsFactory = function() {
        var self = this,
            templateCache = {};

        var loadTemplate = function(relativeTemplatePath) {
            var tempPath = require.resolve(relativeTemplatePath);
            if (_.has(templateCache, tempPath)) {
                return templateCache[tempPath];
            }
            var template = fs.readFileSync(tempPath, {'encoding':'utf8'});
            templateCache[tempPath] = template;
            return template;
        };

        this.createNewClass = function(className, cwd, project) {
            var filePath = path.join(cwd, className + '.js'),
                relPath = this.getRelativeClassPath(filePath, project),
                fullName = this.getNewClassName(className, relPath, project),
                code = this.getNewClass(className, fullName);

            this.writeNewClassFile(filePath, code);
            return {
                'name': fullName,
                'shortName': className,
                'path': relPath,
                'filePath': filePath
            };
        };

        /**
         * Creates the full class name (including packages) for 
         * a new class based on its file path.
         * @param  {String}        className Short class name
         * @param  {String}        classPath Relative path of class to source directory
         * @param  {ProjectJsFile} project   ProjectJsFile object
         * @return {String}                  Fully qualified class name
         */
        this.getNewClassName = function(className, classPath, project) {
            var normalizedClassPath = path.normalize(classPath),
                dirs = normalizedClassPath.split(path.sep),
                len = dirs.length,
                packs = [ project.getBaseNamespace() ];
            for (var i=0; i<len; i++) {
                if (!_.isEmpty(dirs[i]) && dirs[i] !== className) {
                    packs.push(dirs[i].toLowerCase());
                }
            }
            packs.push(className);
            return packs.join(".");
        };

        this.writeNewClassFile = function(filePath, code) {
            fs.writeFileSync(filePath, code, {'encoding':'utf8'});
            return true;
        };

        /**
         * Creates the code for a new class
         * @param  {String} className Desired class name
         * @param  {String} fullName  Desired namespaced class name
         * @return {String}           Base class code
         */
        this.getNewClass = function(className, fullName) {
            var template = loadTemplate('./templates/class.template.js'),
                args = {
                    'className': className,
                    'fullName': fullName
                };
            return Mustache.render(template, args);
        };

        /**
         * Gets the class file path relative to either the project
         * root or the source directory. 
         * @param  {String}        filePath Absolute file path of class file
         * @param  {ProjectJsFile} project  ProjectJsFile object
         * @return {String}                 Relative file path to class file
         */
        this.getRelativeClassPath = function(filePath, project) {
            var relPath;
            if (project.hasSrcDir()) {
                var absSrcDir = path.resolve(project.getRootDir(), project.getSrcDir());
                relPath = path.relative(absSrcDir, filePath);
            } else {
                relPath = path.relative(project.getRootDir(), filePath);
            }
            if (util.hasJsFileExtension(relPath)) {
                return './' + util.convertBackSlashes(relPath.slice(0, -3));
            }
            return './' + util.convertBackSlashes(relPath);
        };

        /**
         * Creates a start script
         * @param  {String} className Full name of the class
         * @param  {String} classPath Relative path to the class file
         * @param  {String} method    The class method to invoke
         * @param   {Array} arguments Optional. An array of arguments to pass to
         *                            the method.
         * @return {String}           Start script code
         */
        this.getStartScript = function(options) {
            if (!_.has(options, 'className') || !_.has(options, 'classPath') || 
                !_.has(options, 'method')) {
                throw new Error("Missing a required parameter!");
            }
            var shortName = util.getClassName(options['className']),
                instanceName = shortName[0].toLowerCase() + shortName.slice(1),
                version = ownVersion.sync(),
                templateArgs = {
                    "className": shortName,
                    "instanceName": instanceName,
                    "classPath": options["classPath"],
                    "method": options["method"],
                    "version": version
                };
            // assemble method arguments if needed
            if (_.has(options, "arguments")) {
                var rawArgs;
                if (_.isArray(options["arguments"])) {
                    rawArgs = options["arguments"];
                } else {
                    rawArgs = [ options["arguments"] ];
                }
                if (rawArgs.length > 0) {
                    templateArgs["arguments"] = util.writeMethodArgStr(rawArgs, 
                                                                        ", ");
                }
            }
            // load and assemble template
            var template = loadTemplate("./templates/startscript.template.js");
            return Mustache.render(template, templateArgs);
        };

        /**
         * Creates a new project.json file
         * @param  {String} baseNs   Base namespace. Required.
         * @param  {String} srcDir   Source directory path
         * @param  {String} buildDir Build directory path
         * @param  {String} version  Current project.js version
         * @return {Object}          Project description JSON as String
         */
        this.getProjectJson = function(options) {
            if (!_.has(options, 'baseNs') || _.isUndefined(options.baseNs)) {
                throw new Error("Missing a required parameter!");
            }            
            // assemble values to past to template
            var templateArgs = {
                'baseNs': options.baseNs,
                'srcDir': _.has(options, 'srcDir') ? options.srcDir : "",
                'buildDir': _.has(options, 'buildDir') ? options.buildDir : ""
            };
            // get version if needed
            if (!_.has(options, 'version')) {
                templateArgs['ownVersion'] = ownVersion.sync();
            } else {
                templateArgs['ownVersion'] = options['version'];
            }
            // load and return template
            var template = loadTemplate("./templates/project.template.json");
            return Mustache.render(template, templateArgs);
        };
    };

    return ProjectJsFactory;

})();
