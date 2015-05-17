describe("ProjectJsFileUtil", function() {
    var ProjectJsFileUtil = require("../lib/file");
    var fs = require('fs');
    var path = require('path');
    var uuidgen = require('node-uuid');

    var fileUtil;

    describe("copyDirectory", function() {
        var tmpPath,
            fromPath,
            toPath,
            fileName,
            filePath,
            ignoreFileName,
            ignoreFilePath;

        var generateRandomTmpName = function() {
            var uuid = uuidgen.v4();
            return "tmp" + uuid.replace(/\-/g, "");
        };

        beforeAll(function() {
            fileUtil = new ProjectJsFileUtil();
            tmpPath = path.join(__dirname, "tmp");
            fromPath = path.join(tmpPath, generateRandomTmpName());
            toPath = path.join(tmpPath, generateRandomTmpName());
            fileName = generateRandomTmpName() + ".txt";
            filePath = path.join(fromPath, fileName);
            ignoreFileName = generateRandomTmpName() + ".tmp";
            ignoreFilePath = path.join(fromPath, ignoreFileName);
            // create everything
            fs.mkdirSync(tmpPath);
            fs.mkdirSync(fromPath);
            fs.mkdirSync(toPath);
            fs.writeFileSync(filePath, "===CONTENT===", {'encoding': 'utf8'});
            fs.writeFileSync(ignoreFilePath, "===CONTENT===", {'encoding': 'utf8'});
        });

        it("should copy all files in a directory to another directory", function() {
            var map = fileUtil.mapDirectory(fromPath, {
                'excludeFiles': ['*.tmp']
            });
            fileUtil.copyDirectory(map, toPath);
            var expectedFilePath = path.join(toPath, fileName);
            expect(fs.existsSync(expectedFilePath)).toBe(true);
            expect(fs.existsSync(path.join(toPath, ignoreFileName))).toBe(false);
            var copiedContent = fs.readFileSync(expectedFilePath, {'encoding': 'utf8'});
            expect(copiedContent).toEqual("===CONTENT===");
        });

        afterAll(function() {
            fs.unlinkSync(filePath);
            fs.unlinkSync(ignoreFilePath);
            var copiedFiles = fs.readdirSync(toPath);
            for (var i=0; i<copiedFiles.length; i++) {
                fs.unlinkSync(path.join(toPath, copiedFiles[i]));
            }
            fs.rmdirSync(fromPath);
            fs.rmdirSync(toPath);
            fs.rmdirSync(tmpPath);
        });

    });
});