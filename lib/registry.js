module.exports = (function() {

    var _ = require('underscore');
    var util = require('./util');

    var ProjectJsRegistry = function(args) {
        var self = this,
            baseNs = _.has(args, "base") ? args["base"] : null,
            map = _.has(args, "map") ? args["map"] : {},
            dependencyMap = _.has(args, "dependencies") ? args["dependencies"] : {},
            aliasMap = _.has(args, "aliases") ? args["aliases"] : {},
            isCompiled = _.has(args, "useCompileSuffix") ? args["useCompileSuffix"] : false;

        var getFilePath = function(path) {
            return isCompiled ? path + ".tmp" : path;
        };

        var getClassPath = function(name) {
            if (_.has(map, name) && _.isString(map[name]) && !_.isEmpty(map[name])) {
                return getFilePath(map[name]);
            }
            return null;
        };

        var getPackageMap = function(packageName) {
            var classList = map[packageName],
                len = classList.length,
                packageMap = {},
                className;
            for (var i=0; i<len; i++) {
                className = util.getClassName(classList[i]);
                packageMap[ className ] = getClassPath(classList[i]);
            }
            return packageMap;
        };

        var getRelativeName = function(name) {
            return baseNs + "." + name;
        };

        /* Map Functions */

        this.has = function(name) {
            return _.has(map, name);
        };

        this.get = function(name) {
            return map[name];
        };

        this.set = function(name, value) {
            map[name] = value;
        };

        /* Dependency Functions */

        this.hasDependency = function(name) {
            return _.has(dependencyMap, name);
        };

        this.getDependency = function(name) {
            return dependencyMap[name];
        };

        this.setDependency = function(name, path) {
            dependencyMap[name] = path;
        };

        /* Alias Functions */

        this.hasAlias = function(name) {
            return _.has(aliasMap, name);
        };

        this.getAlias = function(name) {
            return aliasMap[name];
        };

        this.setAlias = function(alias, className) {
            aliasMap[alias] = className;
        };

        /* use compile suffix getter/setter */

        this.useCompileSuffix = function() {
            if (arguments.length > 0) {
                isCompiled = arguments[0];
                return;
            }
            return isCompiled;
        };

        this.resolve = function(name) {
            var isPackageName = util.isPackageName(name);
            if (this.has(name) && !isPackageName) {
                return getClassPath(name);
            }
            if (this.has(name) && isPackageName) {
                return getPackageMap(name);
            }
            // check for dependencies
            if (this.hasDependency(name) && !isPackageName) {
                return this.getDependency(name);
            }
            // check for alias
            if (this.hasAlias(name)) {
                return this.resolve(this.getAlias(name));
            }
            // check for relative name 
            if (baseNs !== null && name.indexOf(baseNs) === -1) {
                return this.resolve(getRelativeName(name));
            }
            return null;
        };
    }
    ProjectJsRegistry.prototype = {
        toString: function() {
            return "[object ProjectJsRegistry]";
        }
    };

    return ProjectJsRegistry;

})();