
module.exports = (function() {
    var fs = require('fs-extra');
    var path = require('path');
    var Mustache = require('mustache');
    var _ = require('underscore');
    var util = require('./util');

    var ProjectJsFactory = function() {

        this.createNewClass = function(className, cwd, projectRoot, baseNs) {
            var fullName = this.getNewClassName(className, cwd, projectRoot, baseNs),
                code = this.getNewClass(className, fullName),
                filePath = path.join(cwd, className + '.js'),
                relPath = this.getRelativeClassPath(projectRoot, filePath);
            this.writeNewClassFile(code, filePath);
            return {
                'name': fullName,
                'shortName': className,
                'path': relPath,
                'filePath': filePath
            };
        };

        this.getNewClassName = function(className, classDir, projectRoot, baseNs) {
            var relPath = path.relative(projectRoot, classDir),
                dirs = relPath.split(path.sep),
                len = dirs.length,
                packs = [ baseNs ];
            for (var i=0; i<len; i++) {
                if (!_.isEmpty(dirs[i])) {
                    packs.push(dirs[i].toLowerCase());
                }
            }
            packs.push(className);
            return packs.join(".");
        };

        this.writeNewClassFile = function(code, filePath) {
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
            var templatePath = this.getTemplatePath('./templates/class.template.js'),
                template = fs.readFileSync(templatePath, {'encoding':'utf8'}),
                args = {
                    'className': className,
                    'fullName': fullName
                };
            return Mustache.render(template, args);
        };

        this.getTemplatePath = function(template) {
            return require.resolve(template);
        };

        this.getRelativeClassPath = function(projectRoot, filePath) {
            var relPath = path.relative(projectRoot, filePath);
            if (util.hasJsFileExtension(relPath)) {
                return './' + relPath.slice(0, -3);
            }
            return './' + relPath;
        };
    };

    return ProjectJsFactory;

})();
