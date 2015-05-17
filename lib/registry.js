module.exports = (function() {

    var path = require('path');
    var _ = require('underscore');
    var util = require('./util');

    var ProjectJsRegistry = function(args, options) {
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
            isAddingSrc = _.has(options, "addSrcDir") ? options["addSrcDir"] : false,
            compileSuffix = _.has(options, "compileSuffix") ? options["compileSuffix"] : ".tmp",
            isCompileSuffixEmpty = _.isEmpty(compileSuffix),
            isAddingSuffix = _.has(options, "addCompileSuffix") ? options["addCompileSuffix"] : false;

        var resolveClassFilePath = function(classPath) {
            var filePath = classPath;
            if (isAddingSrc && !isSrcDirEmpty) {
                filePath = './' + path.join(srcDir, classPath);
            }
            return (isAddingSuffix && !isCompileSuffixEmpty) ? filePath + compileSuffix : filePath;
        };

        var getClassFilePath = function(name) {
            if (_.has(map, name) && _.isString(map[name]) && !_.isEmpty(map[name])) {
                return resolveClassFilePath(map[name]);
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
                packageMap[ className ] = getClassFilePath(classList[i]);
            }
            return packageMap;
        };

        var getFullName = function(name) {
            return baseNs + "." + name;
        };

        var getSrcDirName = function() {
            return util.convertBackSlashes(path.normalize(srcDir));
        }

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

        /* get class from filename */

        /**
         * Returns the fully resolved class name of the
         * given file path (if registered)
         * @param  {String} filePath File path of a class file
         * @param  {String} rootDir  Optional. The root directory of the project.
         * @return {String}          The class name if found, null otherwise.
         */
        this.getClassNameFromFilePath = function(filePath) {
            var classFilePath,
                fp = util.convertBackSlashes(filePath);
            if (isAddingSrc && !isSrcDirEmpty && fp.indexOf(getSrcDirName()) > -1) {
                var srcDirName = getSrcDirName(),
                    srcDirIndex = fp.indexOf(srcDirName) + srcDirName.length,
                    slicedPath = fp.substr(srcDirIndex);
                if (slicedPath.search(/^\//i) > -1) {
                    // if sliced path starts with a slash
                    classFilePath = "." + slicedPath;
                } else {
                    classFilePath = "./" + slicedPath;
                }
            } else if (arguments.length > 1 && path.isAbsolute(arguments[1])) {
                var rootDir = util.convertBackSlashes(arguments[1]);
                if (fp.indexOf(rootDir) > -1) {
                    var classPathIndex = fp.indexOf(rootDir) + rootDir.length;
                    classFilePath = fp.substr(classPathIndex);
                } else if (fp.indexOf(util.removeDrive(rootDir)) > -1) {
                    var rootDirMinusDrive = util.removeDrive(rootDir),
                        minusDriveIndex = fp.indexOf(rootDirMinusDrive) + rootDirMinusDrive.length;
                    classFilePath = fp.substr(minusDriveIndex);
                }
            }
            if (!_.isUndefined(classFilePath)) {
                // remove .js file extension if needed
                var classFp;
                if (classFilePath.search(/\.js$/i) > -1) {
                    classFp = classFilePath.replace(/\.js$/i, '');
                } else {
                    classFp = classFilePath;
                }
                // search for file in map
                var classFile;
                for (var className in map) {
                    val = map[className];
                    if (_.isString(val) && val === classFp) {
                        return className;
                    }
                }
            }
            return null;
        };

        /* Resolve functionality */

        this.resolve = function(name) {
            var isPackageName = util.isPackageName(name);
            if (this.has(name) && !isPackageName) {
                return getClassFilePath(name);
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
                return this.resolve(getFullName(name));
            }
            return null;
        };

        this.getClasses = function() {
            var classMap = {};
            for (var key in map) {
                if (!util.isPackageName(key)) {
                    classMap[key] = getClassFilePath(key);
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