module.exports = (function() {

//////////////////////////////////////
// various useful utility functions //
//////////////////////////////////////

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
        return writeObjectStr(val);
    }
    return null;
};

var writeObjectStr = function(obj) {
    var pairs = _.pairs(obj),
        keyVals = [];
    _.each(pairs, function(pair){
        var valStr = writeValueStr(pair[1]);
        keyVals.push("'" + pair[0] + "': " + valStr);
    });
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