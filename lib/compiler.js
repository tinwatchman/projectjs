module.exports = (function() {

var fs = require('fs');
var path = require('path');
var util = require('./util');

var ProjectCompiler = function() {

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
        var compileText = "module.exports = (function() {\r\n\r\n" + classText + 
                            "\r\n\r\nreturn " + shortClassName + ";\r\n\r\n})();";

        // create temporary file
        var tmpPath = classDir + path.sep + shortClassName + ".tmp.js";
        fs.writeFileSync(tmpPath, compileText, { 'encoding': 'utf8', 'flag': 'w' });

        return tmpPath;
    };
}

return ProjectCompiler;

})();