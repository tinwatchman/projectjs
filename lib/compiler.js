module.exports = (function() {

var fs = require('fs-extra');
var path = require('path');
var _ = require('underscore');
var ProjectJsFactory = require('./factory');
var FileUtil = require('./file');
var util = require('./util');


var ProjectJsCompiler = function() {
    var self = this;

    /**
     * Builds project for export -- meaning that all use statements
     * are replaced with standard Node require() statements.
     * 
     * @param  {ProjectJsFile}     project  ProjectJsFile object
     * @param  {ProjectJsRegistry} registry Registry object
     * @return {void}          
     */
    this.buildProject = function(project, registry) {
        var classMap = project.getNamespace().map,
            isFolderBuild = false,
            buildFolder,
            isSrcFolder = false,
            srcFolder;
        if (project.hasBuildDir()) {
            isFolderBuild = true;
            buildFolder = path.normalize( project.getBuildDir() );
            if (!path.isAbsolute(buildFolder)) {
                buildFolder = path.normalize(path.resolve(project.getRootDir(), project.getBuildDir()));
            }
        }
        if (project.hasSrcDir()) {
            isSrcFolder = true;
            srcFolder = path.normalize( project.getSrcDir() );
            registry.isAddingSrcDir(false);
            if (!path.isAbsolute(srcFolder)) {
                srcFolder = path.normalize(path.resolve(project.getRootDir(), project.getSrcDir()));
            }
        }

        // compile class files
        var args,
            classFileList = [],
            outFilePath,
            classPath;
        for (var fullName in classMap) {
            if (util.isPackageName(fullName)) {
                throw new Error("what the hell is a package doing in there?!");
            }
            classPath = classMap[fullName];
            args = {
                'name': fullName,
                'registry': registry,
                'removeUses': true
            };
            if (isSrcFolder) {
                args['path'] = util.getAbsoluteFilePath(classPath, srcFolder);
            } else {
                args['path'] = util.getAbsoluteFilePath(classPath, project.getRootDir());
            }
            if (isFolderBuild) {
                args['outputPath'] = util.getAbsoluteFilePath(classPath, buildFolder);
            } else if (isSrcFolder) {
                args['outputPath'] = util.getAbsoluteFilePath(classPath + ".tmp.js", srcFolder);
            } else {
                args['outputPath'] = util.getAbsoluteFilePath(classPath + ".tmp.js", project.getRootDir());
            }
            outFilePath = this.compileClassFile(args);
            classFileList.push(path.basename(outFilePath));
        }

        // copy dependencies and resources if necessary
        if (isFolderBuild && isSrcFolder) {
            var fileUtil = new FileUtil(),
                excludes = classFileList.concat(['.DS_Store', 'project.json', 'Thumbs.db']),
                resMap = fileUtil.mapDirectory(srcFolder, {
                    'excludeFiles': excludes,
                    'excludePaths': [ buildFolder ]
                });
            fileUtil.copyDirectory(resMap, buildFolder);
        } else if (isFolderBuild) {
            var fileUtil = new FileUtil(),
                excludes = classFileList.concat(['.DS_Store', 'project.json']),
                resMap = fileUtil.mapDirectory(project.getRootDir(), {
                    'excludeFiles': excludes,
                    'excludePaths': [ buildFolder ]
                });
            fileUtil.copyDirectory(resMap, buildFolder);
        }

        // handle start point
        var startInfo = project.hasStart() ? project.getStart() : undefined;
        if (_.isString(startInfo) && isFolderBuild) {
            // if we've just been provided a path to a start script
            var buildStartPath = path.join(buildFolder, startInfo),
                srcStartPath;
            if (isSrcFolder) {
                srcStartPath = path.join(srcFolder, startInfo);
            } else {
                srcStartPath = path.join(project.getRootDir(), startInfo);
            }
            if (fs.existsSync(srcStartPath)) {
                // load start script
                var rawScript = fs.readFileSync(filePath, {'encoding':'utf8'});
                // replace uses in start script
                var script = this.replaceUses(startInfo, rawScript, registry);
                // write file
                fs.ensureDirSync(path.dirname(buildStartPath));
                fs.writeFileSync(buildStartPath, script, {'encoding':'utf8'});
            } else {
                throw new Error("ERROR: Start script not found");
            }
        } else if (!_.isString(startInfo) && _.isObject(startInfo)) {
            // if we have to create the build script, on the other hand...
            var factory = new ProjectJsFactory(),
                scriptOpts = {
                    'className': startInfo['class'],
                    'method': startInfo['method']
                },
                scriptPath = startInfo['output'],
                scriptAbsPath,
                classAbsPath;
            // get output script absolute path
            if (!util.hasJsFileExtension(scriptPath)) {
                scriptPath += '.js';
            }
            if (isFolderBuild) {
                scriptAbsPath = path.join(buildFolder, scriptPath);
            } else if (isSrcFolder) {
                scriptAbsPath = path.join(srcFolder, scriptPath);
            } else {
                scriptAbsPath = path.join(project.getRootDir(), scriptPath);
            }
            // get class path relative to script absolute path
            classPath = registry.resolve(startInfo['class']);
            if (isFolderBuild) {
                classAbsPath = util.getAbsoluteFilePath(classPath, buildFolder);
            } else if (isSrcFolder) {
                classAbsPath = util.getAbsoluteFilePath(classPath, srcFolder);
            } else {
                classAbsPath = util.getAbsoluteFilePath(classPath, project.getRootDir());
            }
            scriptOpts['classPath'] = this.getRelativeCodePath(scriptAbsPath, classAbsPath);
            // add method arguments if necessary
            if (_.has(startInfo, "arguments")) {
                scriptOpts['arguments'] = startInfo['arguments'];
            }
            // write script
            var startScript = factory.getStartScript(scriptOpts);
            fs.ensureDirSync(path.dirname(scriptAbsPath));
            fs.writeFileSync(scriptAbsPath, startScript, {'encoding':'utf8'});
        }
    };

    /**
     * Compiles a project to be run via a ProjectJsRunner.
     * @param  {ProjectJsFile}     project  ProjectJsFile object
     * @param  {ProjectJsRegistry} registry ProjectJsRegistry object
     * @return {Array}                      List of all files created
     */
    this.compileProject = function(project, registry) {
        var classMap = project.getNamespace().map,
            isSrcFolder = false,
            srcFolder,
            classPath,
            args,
            tmpFiles = [],
            tmpFile;
        if (project.hasSrcDir()) {
            isSrcFolder = true;
            srcFolder = path.normalize( project.getSrcDir() );
            if (!path.isAbsolute(srcFolder)) {
                srcFolder = path.normalize(path.resolve(project.getRootDir(), project.getSrcDir()));
            }
        }

        for (var className in classMap) {
            classPath = classMap[className];
            args = {
                'name': className,
                'registry': registry,
                'removeUses': false
            };
            if (isSrcFolder) {
                args['path'] = util.getAbsoluteFilePath(classPath, srcFolder);
                args['outputPath'] = util.getAbsoluteFilePath(classPath + ".tmp.js", srcFolder);
            } else {
                args['path'] = util.getAbsoluteFilePath(classPath, project.getRootDir());
                args['outputPath'] = util.getAbsoluteFilePath(classPath + ".tmp.js", project.getRootDir());
            }
            tmpFile = this.compileClassFile(args);
            tmpFiles.push(tmpFile);
        }

        return tmpFiles;
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
            var regPath = args.registry.resolve(args.name);
            code = this.replaceUses(regPath, rawCode, args.registry);
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

    /**
     * Given the name of a class and its code, wraps the class in the necessary
     * boilerplate code and returns it as a String.
     * @param  {String} className The short name of the class, minus namespace
     * @param  {String} code      The class' code
     * @return {String}           The class code, wrapped in the necessary 
     *                            boilerplate
     */
    this.addClassBoilerplate = function(className, code) {
        return "module.exports = (function() {\r\n" + code + 
            "\r\n\r\nreturn " + className + ";\r\n})();";
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
     * @param  {String}            filePath  Path to the file the code is in
     * @param  {String}            code      A string of code
     * @param  {ProjectJsRegistry} registry  A ProjectJsRegistry object
     * @return {String}                      The edited code
     */
    this.replaceUses = function(filePath, code, registry) {
        var useList = this.findUses(code),
            newCode = code,
            len = useList.length,
            start,
            end,
            regPath,
            classPath,
            replaceStr;
        registry.isAddingSrcDir(false);
        for (var i=0; i<len; i++) {
            if (_.isNull(useList[i].name)) {
                throw new Error("Could not find name in match " + 
                    useList[i].match);
            }
            start = newCode.indexOf(useList[i].match);
            end = start + useList[i].match.length;
            regPath = registry.resolve(useList[i].name);
            if (_.isString(regPath)) {
                // if a class
                // need to get path relative to the current file path
                classPath = this.getRelativeCodePath(filePath, regPath);
                replaceStr = wrapInRequire(classPath);
            } else if (_.isObject(regPath)) {
                // if a package
                replaceStr = this.makePackageRequireMap(regPath, filePath);
            }
            newCode = newCode.slice(0, start) + replaceStr + newCode.slice(end);
        }
        return newCode;
    };

    /**
     * Turns a package reference in a map of standard Node
     * require() statements.
     * @param  {Object} map      Map of the package
     * @param  {String} filePath The file requesting the package
     * @return {String}          Package map written to a String
     */
    this.makePackageRequireMap = function(map, filePath) {
        var requireMap = _.mapObject(map, function(registryPath) {
            var requirePath = self.getRelativeCodePath(filePath, registryPath);
            return wrapInRequire(requirePath);
        });
        return util.writeObjectStr(requireMap, false);
    };

    /**
     * Gets a relative path from the given path to
     * the given file.
     * @param  {String} from File to get relative path from
     * @param  {String} to   File to get relative path to
     * @return {String}      Relative path (Unix style)
     */
    this.getRelativeCodePath = function(from, to) {
        var fromFile,
            toFile;
        if (!util.hasJsFileExtension(from)) {
            fromFile = util.convertBackSlashes(from + ".js");
        } else {
            fromFile = util.convertBackSlashes(from);
        }
        if (!util.hasJsFileExtension(to)) {
            toFile = util.convertBackSlashes(to + ".js");
        } else {
            toFile = util.convertBackSlashes(to);
        }
        var fromDir = path.dirname(fromFile),
            relPath = path.relative(fromDir, toFile);
        if (relPath[0] !== ".") {
            return './' + relPath.slice(0, -3);
        }
        return relPath.slice(0, -3);
    };

    var wrapInRequire = function(somePath) {
        return "require('" + somePath + "')";
    };
}

return ProjectJsCompiler;

})();