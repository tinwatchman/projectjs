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

var getClassName = function(name) {
    return (name.indexOf('.') > -1) ? name.substring(name.lastIndexOf('.') + 1) : null;
};

var hasJsFileExtension = function(fileName) {
    return (fileName.indexOf(".js") === (fileName.length - 3));
};

// public api
return {
    'isPackageName': isPackageName,
    'getPackage': getPackage,
    'getClassName': getClassName,
    'hasJsFileExtension': hasJsFileExtension
};

})();