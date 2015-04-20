module.exports = (function() {

//////////////////////////////////////
// various useful utility functions //
//////////////////////////////////////

var _ = require('underscore');

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

// public api
return {
    'isPackageName': isPackageName,
    'getPackage': getPackage,
    'getPackageName': getPackageName,
    'getClassName': getClassName,
    'hasJsFileExtension': hasJsFileExtension,
    'writeValueStr': writeValueStr,
    'writeObjectStr': writeObjectStr
};

})();