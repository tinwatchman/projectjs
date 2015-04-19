module.exports = (function() {

//////////////////////////
// ProjectJs File Utils //
//////////////////////////

var fs = require('fs-extra');
var path = require('path');
var _ = require('underscore');

var ProjectJsFileUtil = function() {

    this.mapDirectory = function(rootDir, options) {
        var opts = _.extend({
            'excludePaths': [],
            'excludeFiles': [],
            'includeFiles': []
        }, options);

        if (opts.includeFiles.length > 0) {
            opts.isInclusiveSearch = true;
        } else {
            opts.isInclusiveSearch = false;
        }

        // private utility functions
        var isExcludedPath = function(dirPath, excludePaths) {
            var len = excludePaths.length;
            for (var i=0; i<len; i++) {
                if (excludePaths[i] === dirPath) {
                    return true;
                }
            }
            return false;
        };

        var isFileMatch = function(fileName, files) {
            var len = files.length,
                ext = "*" + path.extname(fileName);
            for (var i=0; i<len; i++) {
                if (files[i] === ext || files[i] === fileName) {
                    return true;
                }
            }
            return false;
        };

        var mapDir = function(dir, opts) {
            var files = fs.readdirSync(dir);
            var fileMap = { '.___dirpath.': dir },
                len = files.length,
                absPath,
                stats;
            for (var i=0; i<len; i++) {
                absPath = path.join(dir, files[i]);
                stats = fs.statSync(absPath);
                if (stats.isFile() && ( (opts.isInclusiveSearch && isFileMatch(files[i], opts.includeFiles)) || 
                    !isFileMatch(files[i], opts.excludeFiles) )) {
                    fileMap[ files[i] ] = absPath;
                } else if (stats.isDirectory() && !isExcludedPath(absPath, opts.excludePaths)) {
                    fileMap[ files[i] ] = mapDir(absPath, opts);
                }
            }
            return fileMap;
        };

        // let's get started
        return mapDir(rootDir, opts);
    };

    this.copyDirectory = function(fileMap, targetDir) {

        var getTargetFilePath = function(filePath, rootDir, targetDir) {
            var relPath = path.relative(rootDir, filePath);
            return path.join(targetDir, relPath);
        };

        var copyDir = function(dirMap, rootDir, targetDir) {
            fs.ensureDirSync(dirMap['.___dirpath.']);
            var toPath;
            for (var name in dirMap) {
                if (name !== '.___dirpath.' && _.isString(dirMap[name])) {
                    toPath = getTargetFilePath(dirMap[name], rootDir, targetDir);
                    fs.copySync(dirMap[name], toPath);
                } else if (name !== '.___dirpath.' && _.isObject(dirMap[name])) {
                    // copy directory
                    copyDir(dirMap[name], rootDir, targetDir);
                }
            }
        };

        var rootDir = fileMap['.___dirpath.'];
        copyDir(fileMap, rootDir, targetDir);

    };

}

return ProjectJsFileUtil;

})();