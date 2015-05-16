describe("ProjectJsFactory", function() {
    var ProjectJsFactory = require('../lib/factory');
    var ProjectJsFile = require('../lib/projectfile');
    var fs = require('fs-extra');
    var factory;

    beforeEach(function() {
        factory = new ProjectJsFactory();
    });

    describe("getRelativeClassPath", function() {
        it("should exist", function() {
            expect(factory.getRelativeClassPath).toBeDefined();
            expect(factory.getRelativeClassPath).toBeFunction();
        });

        it("should return a relative path from the source directory", function() {
            var projectFile = new ProjectJsFile({
                    "data": {
                        "namespace": {
                            "base": "my.project",
                            "map": {},
                        },
                        "srcDir": "./src"
                    },
                    "rootDir": "/Users/someone/something/dev/myproject"
                }),
                filePath = "/Users/someone/something/dev/myproject/src/mypackage/NewClass.js",
                expectedResult = "./mypackage/NewClass";
            var result = factory.getRelativeClassPath(filePath, projectFile);
            expect(result).toEqual(expectedResult);
        });

        it("should return a relative path from the project root (if no source directory named)", function() {
            var projectFile = new ProjectJsFile({
                    "data": {},
                    "rootDir": "/Users/someone/something/dev/myproject"
                }),
                filePath = "/Users/someone/something/dev/myproject/mypackage/NewClass.js",
                expectedResult = "./mypackage/NewClass";
            var result = factory.getRelativeClassPath(filePath, projectFile);
            expect(result).toEqual(expectedResult);
        });
    });

    describe("getNewClassName", function() {
        it("should exist", function() {
            expect(factory.getNewClassName).toBeDefined();
            expect(factory.getNewClassName).toBeFunction();
        });

        it("should return a full class name based on file location", function() {
            var projectFile = new ProjectJsFile({
                    "data": {
                        "namespace": {
                            "base": "my.project"
                        }
                    },
                    "rootDir": "/Users/someone/something/dev/myproject"
                }),
                className = "NewClass",
                classPath = "./mypackage/NewClass",
                expectedResult = "my.project.mypackage.NewClass";

            var result = factory.getNewClassName(className, classPath, projectFile);
            expect(result).toEqual(expectedResult);
        });
    });

    describe("getStartScript", function() {

        it("should exist", function() {
            expect(factory.getStartScript).toBeDefined();
            expect(factory.getStartScript).toBeFunction();
        });

        it("should output a script that loads a class, creates an instance, and calls a specific method", function() {
            var args = {
                'className': 'some.namespace.SomeClass',
                'classPath': './SomeClass',
                'method': 'start'
            };
            var result = factory.getStartScript(args);
            expect(result).toMatch(/var SomeClass = require\(\W\.\/SomeClass\W\);/);
            expect(result).toMatch(/var someClass = new SomeClass\(\);/);
            expect(result).toMatch(/someClass\.start\(\);/)
        });

        it("should support start method arguments", function() {
            var args = {
                'className': 'some.namespace.SomeClass',
                'classPath': './SomeClass',
                'method': 'start',
                'arguments': [ 2, 5, "go" ]
            };
            var result = factory.getStartScript(args);
            var output = "var SomeClass = require(./SomeClass\W);\r\n" +
                         "var someClass = new SomeClass();\r\n" + 
                         "someClass.start(2, 5, 'go');";
            expect(result).toMatch(/someClass\.start\(2, 5, \Wgo\W\);/);
        });

    });

    describe("getProjectJson", function() {

        it("should return a JSON string representing a new project.json file", function() {
            var args = {
                "baseNs": "sample.namespace",
                "srcDir": "source",
                "buildDir": "build",
                "version": "whatever-version"
            };
            var result = factory.getProjectJson(args),
                parsed = JSON.parse(result);
            expect(parsed.namespace).toBeDefined();
            expect(parsed.namespace.base).toEqual("sample.namespace");
            expect(parsed.srcDir).toEqual("source");
            expect(parsed.buildDir).toEqual("build");
            expect(parsed.schema.version).toEqual("whatever-version");
        });
        
    });
});
