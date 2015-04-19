module.exports = (function() {

var fs = require('fs');
var path = require('path');
var util = require('./util');

var ProjectJsCompiler = function() {

    /**
     * Writes a temporary JS file that wraps the
     * given class and takes care of a bunch of the
     * boilerplate code.
     * @param  {String} className Qualified name of the class
     * @param  {String} classPath Absolute path to the class file
     * @return {String}           Absolute path to the temp JS file
     */
    this.compileClassFile = function(className, classPath) {
        // get short form of class name
        var shortClassName = util.getClassName(className);
        if (shortClassName === null) {
            shortClassName = className;
        }

        // get file path
        var filePath;
        if (!util.hasJsFileExtension(classPath)) {
            filePath = classPath + ".js";
        } else {
            filePath = classPath;
        }

        // get file directory
        var classDir = path.dirname(classPath);

        // load class file
        var classText = fs.readFileSync(filePath, {'encoding': 'utf8'});

        // wrap class file in boilerplate
        var compileText = this.addClassBoilerplate(shortClassName, classText);

        // create temporary file
        var tmpPath = classDir + path.sep + shortClassName + ".tmp.js";
        fs.writeFileSync(tmpPath, compileText, { 'encoding': 'utf8', 'flag': 'w' });

        return tmpPath;
    };

    /**
     * Given the name of a class and its code, wraps the class in the necessary
     * boilerplate code and returns it as a String.
     * @param  {String} className The short name of the class, minus namespace
     * @param  {String} code      The class' code
     * @return {String}           The class code, wrapped in the necessary 
     *                            boilerplate
     */
    this.addClassBoilerplate = function(className, code) {
        return "module.exports = (function() {\r\n\r\n" + code + 
            "\r\n\r\nreturn " + className + ";\r\n\r\n})();";
    };

    /**
     * finds all use() invocations within the given block of code
     * @param  {String} code String containing code
     * @return {Array}
     */
    this.findUses = function(code) {
        var list = [],
            re = /(\s|=)use\((\'|\")[^\s\(\)]+(\'|\")\)(;|\s)?/g,
            uses = code.match(re);

        if (uses !== null && uses.length > 0) {
            var len = uses.length,
                nameRe = /\((?:\'|\")([^\s\(\)]+)(?:\'|\")\)/,
                match,
                nameMatch,
                name;
            for (var i = 0; i < len; i++) {
                match = uses[i].trim();
                // trim off starting equal sign if necessary
                if (match[0] === '=') {
                    match = match.slice(1);
                }
                // trim off ending semicolon if necessary
                if (match[match.length-1] === ';') {
                    match = match.slice(0, -1);
                }
                nameMatch = nameRe.exec(match);
                if (nameMatch.length > 1) {
                    name = nameMatch[1];
                } else {
                    name = null;
                }
                // push match object
                list.push({
                    'match': match,
                    'name': name
                });
            };
        }
        return list;
    };
}

return ProjectJsCompiler;

})();