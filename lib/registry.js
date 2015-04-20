module.exports = (function() {

    var path = require('path');
    var _ = require('underscore');
    var util = require('./util');

    var ProjectJsRegistry = function(args) {
        if (!_.has(args, "namespace")) {
            throw new ReferenceError("Namespace is required!")
        };
        var self = this,
            baseNs = _.has(args.namespace, "base") ? args.namespace["base"] : null,
            map = _.has(args.namespace, "map") ? args.namespace["map"] : {},
            dependencyMap = _.has(args.namespace, "dependencies") ? args.namespace["dependencies"] : {},
            aliasMap = _.has(args.namespace, "aliases") ? args.namespace["aliases"] : {},
            srcDir = _.has(args, "srcDir") ? args["srcDir"] : "",
            isSrcDirEmpty = _.isEmpty(srcDir),
            isAddingSrc = _.has(args, "addSrcDir") ? args["addSrcDir"] : false,
            compileSuffix = _.has(args, "compileSuffix") ? args["compileSuffix"] : ".tmp",
            isCompileSuffixEmpty = _.isEmpty(compileSuffix),
            isAddingSuffix = _.has(args, "addCompileSuffix") ? args["addCompileSuffix"] : false;

        var resolveClassPath = function(classPath) {
            var filePath = classPath;
            if (isAddingSrc && !isSrcDirEmpty) {
                filePath = './' + path.join(srcDir, classPath);
            }
            return (isAddingSuffix && !isCompileSuffixEmpty) ? filePath + compileSuffix : filePath;
        };

        var getClassPath = function(name) {
            if (_.has(map, name) && _.isString(map[name]) && !_.isEmpty(map[name])) {
                return resolveClassPath(map[name]);
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

        /* add src dir getter/setter */

        this.isAddingSrcDir = function() {
            if (arguments.length > 0) {
                isAddingSrc = arguments[0];
                return;
            }
            return isAddingSrc;
        };

        /* add compile suffix getter/setter */

        this.isAddingCompileSuffix = function() {
            if (arguments.length > 0) {
                isAddingSuffix = arguments[0];
                return;
            }
            return isAddingSuffix;
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

        this.getClasses = function() {
            var classMap = {};
            for (var key in map) {
                if (!util.isPackageName(key)) {
                    classMap[key] = getClassPath(key);
                }
            }
            return classMap;
        };
    }
    ProjectJsRegistry.prototype = {
        toString: function() {
            return "[object ProjectJsRegistry]";
        }
    };

    return ProjectJsRegistry;

})();