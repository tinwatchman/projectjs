module.exports = (function() {

    var _ = require('underscore');
    var util = require('./util');

    var ProjectRegistry = function(args) {
        var self = this,
            baseNs = _.has(args, "baseNamespace") ? args["baseNamespace"] : null,
            map = _.has(args, "map") ? args["map"] : {};

        var getClassPath = function(name) {
            if (_.has(map, name) && _.isString(map[name]) && !_.isEmpty(map[name])) {
                return map[name];
            }
            return null;
        };

        var getPackageMap = function(packageName) {
            var classList = map[packageName],
                len = classList.length,
                packageMap = {};
            for (var i=0; i<len; i++) {
                packageMap[ classList[i] ] = getClassPath(classList[i]);
            }
            return packageMap;
        };

        this.add = function(name, value) {
            map[name] = value;
        };

        this.has = function(name) {
            return _.has(map, name);
        };

        this.resolve = function(name) {
            if (util.isPackageName(name) && _.has(map, name)) {
                return getPackageMap(name);
            }
            return getClassPath(name);
        }
    }

    return ProjectRegistry;

})();