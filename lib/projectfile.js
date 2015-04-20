module.exports = (function() {
    
    var _ = require('underscore');

    var ProjectJsFile = function(data) {
        var _data = data;

        this.getNamespace = function() {
            return _data['namespace'];
        };

        this.getBaseNamespace = function() {
            return _data['namespace']['base'];
        };

        this.getSchema = function() {
            return _data['schema'];
        };

        this.hasStart = function() {
            return (_.has(_data, "start") && !_.isEmpty(_data["start"]));
        };

        this.getStart = function() {
            return _data["start"];
        };

        this.hasBuild = function() {
            return (_.has(_data, "build") && !_.isEmpty(data["build"]));
        };

        this.getBuild = function() {
            return _data["build"];
        };

        this.setBuild = function(value) {
            _data["build"] = value;
        };

        this.addClass = function(className, classPath) {
            _data['namespace'].map[className] = classPath;
        };

        this.toJSON = function() {
            return JSON.stringify(_data, null, 4);
        };
    };

    return ProjectJsFile;
})();