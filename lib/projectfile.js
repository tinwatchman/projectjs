module.exports = (function() {
    
    var _ = require('underscore');

    var ProjectJsFile = function(data) {
        var _data = data;

        this.getNamespace = function() {
            return _data['namespace'];
        };

        this.getSchema = function() {
            return _data['schema'];
        };

        this.hasStart = function() {
            return _.has(_data, "start");
        };

        this.getStart = function() {
            return _data["start"];
        };

        this.hasBuild = function() {
            return _.has(_data, "build");
        };

        this.getBuild = function() {
            return _data["build"];
        };

        this.toJSON = function() {
            return JSON.stringify(_data, null, 4);
        };
    };

    return ProjectJsFile;
})();