module.exports = (function() {

//////////////////////////////////////
// various useful utility functions //
//////////////////////////////////////

var _ = require('underscore');
var path = require('path');

var isPackageName = function(name) {
    return (name === "*" || name.substring(name.length-2) === ".*");
};

var getPackage = function(name) {
    return (name.indexOf('.') > -1) ? name.substring(0, name.lastIndexOf('.')) : null;
};

var getPackageName = function(name) {
    var packName = getPackage(name);
    return (packName !== null) ? packName + ".*" : null;
};

var getClassName = function(name) {
    return (name.indexOf('.') > -1) ? name.substring(name.lastIndexOf('.') + 1) : null;
};

var hasJsFileExtension = function(fileName) {
    return (fileName.indexOf(".js") === (fileName.length - 3));
};

var writeValueStr = function(val) {
    if (_.isString(val)) {
        return "'" + val + "'";
    } else if (_.isNumber(val)) {
        return val;
    } else if (_.isObject(val)) {
        return writeObjectStr(val, true);
    }
    return null;
};

var writeObjectStr = function(obj, processValues) {
    var keyVals = [],
        valStr;
    for (var key in obj) {
        if (processValues) {
            valStr = writeValueStr(obj[key]);
        } else {
            valStr = obj[key];
        }
        keyVals.push("'" + key + "': " + valStr);
    }
    return "{ " + keyVals.join(", ") + " }";
};

var writeMethodArgStr = function(list, separator) {
    var len = list.length,
        args = [],
        arg;
    for (var i=0; i<len; i++) {
        arg = writeValueStr(list[i]);
        if (arg !== null) {
            args.push(arg);
        }
    }
    return args.join(separator);
};

/**
 * get an absolute path from given parameters
 * @param  {String}  relFile  Relative path to a file
 * @param  {String}  absDir   Absolute path to a directory
 * @param  {Boolean} isJsFile Whether or not this is a .js file
 * @return {String}           Absolute path to the file in the directory
 */
var getAbsoluteFilePath = function(relFile, absDir, isJsFile) {
    isJsFile = _.isUndefined(isJsFile) ? true : isJsFile;
    var rel = relFile;
    if (isJsFile && !hasJsFileExtension(relFile)) {
        rel = relFile + ".js";
    }
    return path.join(absDir, rel);
};

/**
 * Converts Windows-style backslashes to Unix-style forward slashes.
 * @param  {String} relativePath Absolute or relative path
 * @return {String}              String with all backslashes replaced
 */
var convertBackSlashes = function(relativePath) {
    while (relativePath.indexOf('\\') > -1) {
        relativePath = relativePath.replace('\\', '/');
    }
    return relativePath;
};

var removeDrive = function(absPath) {
    if (absPath.search(/\w\:/i) > -1) {
        return absPath.replace(/\w\:/gi, '');
    }
    return absPath;
};

// public api
return {
    'isPackageName': isPackageName,
    'getPackage': getPackage,
    'getPackageName': getPackageName,
    'getClassName': getClassName,
    'hasJsFileExtension': hasJsFileExtension,
    'writeValueStr': writeValueStr,
    'writeObjectStr': writeObjectStr,
    'writeMethodArgStr': writeMethodArgStr,
    'getAbsoluteFilePath': getAbsoluteFilePath,
    'convertBackSlashes': convertBackSlashes,
    'removeDrive': removeDrive
};

})();