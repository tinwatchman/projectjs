module.exports = (function() {

var fs = require('fs-extra');
var path = require('path');
var _ = require('underscore');
var util = require('./util');
var FileUtil = require('./file');

var ProjectJsCompiler = function() {

    this.buildProject = function(registry, projectRoot, buildFolder, startInfo) {
        var classMap = registry.getClasses();
        var isFolderBuild = false;
        if (!_.isUndefined(buildFolder) && buildFolder !== null) {
            isFolderBuild = true;
            if (!path.isAbsolute(buildFolder)) {
                buildFolder = path.resolve(projectRoot, buildFolder);
            }
        }

        // compile class files
        var compileArgs,
            classFileList = [],
            outFilePath;
        for (var fullName in classMap) {
            compileArgs = {
                'name': util.getClassName(fullName),
                'path': path.resolve(projectRoot, classMap[fullName]),
                'registry': registry,
                'removeUses': true
            };
            if (isFolderBuild) {
                compileArgs['outputPath'] = this.getBuildFilePath(
                                                classMap[fullName], 
                                                buildFolder
                                            );
            }
            outFilePath = this.compileClassFile(compileArgs);
            classFileList.push(path.basename(outFilePath));
        }

        // copy dependencies if necessary
        // if (isFolderBuild) {
        //     var dependencies = registry.getDependencies(),
        //         dependFile,
        //         dependAbsFile,
        //         dependDir,
        //         dependAbsDir,
        //         dependOutputDir;
        //     for (var key in dependencies) {
        //         dependFile = dependencies[key] + ".js";
        //         dependAbsFile = path.resolve(projectRoot, dependFile);
        //         if (fs.existsSync(dependAbsFile)) {
        //             dependDir = path.dirname(dependFile);
        //         } else {
        //             dependDir = dependencies[key];
        //         }
        //         dependAbsDir = path.resolve(projectRoot, dependDir);
        //         dependOutputDir = path.join(buildFolder, dependDir);
        //         fs.copySync(dependAbsDir, dependOutputDir);
        //     }
        // }

        // copy dependencies and resources if necessary
        if (isFolderBuild) {
            var fileUtil = new FileUtil(),
                excludes = classFileList.concat(['.DS_Store', 'project.json']),
                resMap = fileUtil.mapDirectory(projectRoot, {
                    'excludeFiles': excludes,
                    'excludePaths': [ buildFolder ]
                });
            fileUtil.copyDirectory(resMap, buildFolder);
        }

        // handle start point
        if (_.isString(startInfo) && isFolderBuild) {
            // if we've just been provided a path to a start script, all
            // that's required is to make sure the script has already been
            // copied into the proper folder
            var buildStartPath = path.join(buildFolder, startInfo);
            if (fs.existsSync(buildStartPath)) {
                var srcStartPath = path.join(projectRoot, startInfo);
                fs.ensureDirSync(path.dirname(buildStartPath));
                fs.copySync(srcStartPath, buildStartPath);
            }
        } else if (!_.isString(startInfo) && _.isObject(startInfo)) {
            // if we have to create the build script, on the other hand...
            var className = startInfo['class'],
                classPath = registry.resolve(className),
                methodName = startInfo['method'],
                scriptPath = startInfo['buildScript'],
                scriptOptions = {},
                scriptAbsPath;
            if (isFolderBuild) {
                scriptAbsPath = path.join(buildFolder, scriptPath);
            } else {
                scriptAbsPath = path.join(projectRoot, scriptPath);
            }
            if (_.has(startInfo, "arguments")) {
                scriptOptions.methodArguments = startInfo['arguments'];
            }
            var startScript = this.getStartScript(className, classPath, methodName, scriptOptions);
            fs.writeFileSync(scriptAbsPath, startScript, {'encoding':'utf8'});
        }
    };

    this.getBuildFilePath = function(classPath, buildFolder) {
        var filePath = classPath;
        if (!util.hasJsFileExtension(classPath)) {
            filePath += ".js"
        }
        return path.join(buildFolder, filePath); 
    };

    /**
     * Compiles a class file, removing all uses and adding boilerplate,
     * then writing it to the given location.
     * @param  {String} name       The full class name
     * @param  {String} path       The path to the class file
     * @param  {Object} registry   ProjectJsRegistry object
     * @param  {String} outputPath The path to output the compiled code
     * @param {Boolean} removeUses Whether or not to replace all uses
     * @return {String}            The output file path
     */
    this.compileClassFile = function(args) {
        // get short version of class name
        var shortName = util.getClassName(args.name);
        if (shortName === null) {
            shortName = args.name;
        }

        // get class file path
        var filePath = args.path;
        if (!util.hasJsFileExtension(filePath)) {
            filePath = args.path + ".js";
        }

        // get output path
        var outputPath;
        if (_.has(args, 'outputPath')) {
            outputPath = args.outputPath;
        } else {
            outputPath = path.dirname(filePath) + path.sep + shortName + 
                         ".tmp.js";
        }

        // load class file
        var rawCode = fs.readFileSync(filePath, {'encoding':'utf8'});

        //@todo validate code
        
        // get compile code
        var code = rawCode;
        if (_.has(args, 'removeUses') && args.removeUses === true) {
            code = this.replaceUses(rawCode, args.registry);
        }
        var compiled = this.addClassBoilerplate(shortName, code);

        // write to output
        fs.ensureDirSync(path.dirname(outputPath));
        fs.writeFileSync(outputPath, compiled, {'encoding':'utf8', 'flag':'w'});

        return outputPath;
    };

    /**
     * Writes a temporary JS file that wraps the
     * given class and takes care of a bunch of the
     * boilerplate code.
     * @param  {String} className Qualified name of the class
     * @param  {String} classPath Absolute path to the class file
     * @return {String}           Absolute path to the compiled JS file
     */
    this.compileTempClassFile = function(className, classPath) {
        // get short form of class name
        var shortClassName = util.getClassName(className);
        if (shortClassName === null) {
            shortClassName = className;
        }

        // get file path
        var filePath;
        if (!util.hasJsFileExtension(classPath)) {
            filePath = classPath + ".js";
        } else {
            filePath = classPath;
        }

        // get file directory
        var classDir = path.dirname(classPath);

        // load class file
        var classText = fs.readFileSync(filePath, {'encoding': 'utf8'});

        // wrap class file in boilerplate
        var compileText = this.addClassBoilerplate(shortClassName, classText);

        // create temporary file
        var tmpPath = classDir + path.sep + shortClassName + ".tmp.js";
        fs.writeFileSync(tmpPath, compileText, {'encoding':'utf8', 'flag':'w'});

        return tmpPath;
    };

    this.getStartScript = function(className, classPath, method, options) {
        var shortName = util.getClassName(className),
            shortNameCamelCase = shortName[0].toLowerCase() + 
                                    shortName.slice(1);

        var s = "var " + shortName + " = require('" + classPath + "');\r\n" +
                "var " + shortNameCamelCase + " = new " + shortName + "();\r\n" 
                + shortNameCamelCase + "." + method;
        if (_.has(options, 'methodArguments') && 
            _.isArray(options.methodArguments)) {
            var args = [],
                arg,
                len = options.methodArguments.length;
            for (var i=0; i<len; i++) {
                arg = writeValueStr(options.methodArguments[i]);
                if (arg !== null) {
                    args.push(arg);
                }
            }
            s += "(" + args.join(", ") + ");";
        } else {
            s += "();";
        }
        return s;
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

    /**
     * Given the name of a class and its code, wraps the class in the necessary
     * boilerplate code and returns it as a String.
     * @param  {String} className The short name of the class, minus namespace
     * @param  {String} code      The class' code
     * @return {String}           The class code, wrapped in the necessary 
     *                            boilerplate
     */
    this.addClassBoilerplate = function(className, code) {
        return "module.exports = (function() {\r\n\r\n" + code + 
            "\r\n\r\nreturn " + className + ";\r\n\r\n})();";
    };

    /**
     * finds all use() invocations within the given block of code
     * @param  {String} code String containing code
     * @return {Array}
     */
    this.findUses = function(code) {
        var list = [],
            re = /(\s|=)use\((\'|\")[^\s\(\)]+(\'|\")\)(;|\s)?/g,
            uses = code.match(re);

        if (uses !== null && uses.length > 0) {
            var len = uses.length,
                nameRe = /\((?:\'|\")([^\s\(\)]+)(?:\'|\")\)/,
                match,
                nameMatch,
                name;
            for (var i = 0; i < len; i++) {
                match = uses[i].trim();
                // trim off starting equal sign if necessary
                if (match[0] === '=') {
                    match = match.slice(1);
                }
                // trim off ending semicolon if necessary
                if (match[match.length-1] === ';') {
                    match = match.slice(0, -1);
                }
                nameMatch = nameRe.exec(match);
                if (nameMatch.length > 1) {
                    name = nameMatch[1];
                } else {
                    name = null;
                }
                // push match object
                list.push({
                    'match': match,
                    'name': name
                });
            };
        }
        return list;
    };

    /**
     * Replaces all uses within a code block with standard node requires
     * @param  {String}            code      A string of code
     * @param  {ProjectJsRegistry} registry  A ProjectJsRegistry object
     * @return {String}                      The edited code
     */
    this.replaceUses = function(code, registry) {
        var useList = this.findUses(code),
            newCode = code,
            len = useList.length,
            start,
            end,
            resolved,
            packItems,
            replaceStr;
        for (var i=0; i<len; i++) {
            if (_.isNull(useList[i].name)) {
                throw new Error("Could not find name in match " + 
                    useList[i].match);
            }
            start = newCode.indexOf(useList[i].match);
            end = start + useList[i].match.length;
            resolved = registry.resolve(useList[i].name);
            if (_.isString(resolved)) {
                // if a class
                replaceStr = "require('" + resolved + "')";
            } else if (_.isObject(resolved)) {
                // if a package
                replaceStr = this.makePackageRequireMap(resolved);
            }
            newCode = newCode.slice(0, start) + replaceStr + newCode.slice(end);
        }
        return newCode;
    };

    this.makePackageRequireMap = function(map) {
        var packItems = [];
        for (var key in map) {
            packItems.push(makePackageRequireMapItem(key, map[key]));
        }
        return "{ " + packItems.join(", ") + " }";
    };

    var makePackageRequireMapItem = function(name, path) {
        return "'" + name + "': require('" + path + "')";
    };
}

return ProjectJsCompiler;

})();