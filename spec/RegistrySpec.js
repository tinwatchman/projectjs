describe("ProjectJsRegistry", function() {
    var ProjectJsRegistry = require("../lib/registry");
    var registry;

    describe("resolve", function() {
        beforeEach(function() {
            registry = new ProjectJsRegistry({
                "namespace": {
                    "base": "some.namespace",
                    "map": {
                        "some.namespace.package.SomeClass": "./package/SomeClass",
                        "some.namespace.package.SomeOtherClass": "./package/SomeOtherClass",
                        "some.namespace.package.*": [
                            "some.namespace.package.SomeClass",
                            "some.namespace.package.SomeOtherClass"
                        ]
                    },
                    "dependencies": {
                        "dependency": "./lib/dependency"
                    },
                    "aliases": {
                        "SomeClass": "some.namespace.package.SomeClass",
                        "SomeOtherClass": "some.namespace.package.SomeOtherClass",
                        "SomePackage": "some.namespace.package.*"
                    }
                }
            });
        });

        it("should exist", function() {
            expect(registry.resolve).toBeDefined();
            expect(registry.resolve).toBeFunction();
        });

        it("should resolve class names to filepaths", function() {
            expect(registry.resolve("some.namespace.package.SomeClass")).toEqual("./package/SomeClass");
        });

        it("should support dependencies", function() {
            expect(registry.resolve("dependency")).toEqual("./lib/dependency");
        });

        it("should resolve packages to a map of class names and filepaths", function() {
            var result = registry.resolve("some.namespace.package.*");
            expect(result).toBeObject();
            expect(result).toHaveLength(2);
            expect(result["SomeClass"]).toEqual("./package/SomeClass");
            expect(result["SomeOtherClass"]).toEqual("./package/SomeOtherClass");
        });

        it("should support class aliases", function() {
            expect(registry.resolve("SomeClass")).toEqual("./package/SomeClass");
        });

        it("should support package aliases", function() {
            var result = registry.resolve("SomePackage");
            expect(result).toBeObject();
            expect(result).toHaveLength(2);
            expect(result["SomeClass"]).toEqual("./package/SomeClass");
            expect(result["SomeOtherClass"]).toEqual("./package/SomeOtherClass");
        });

        it("should be able to resolve class names given relative to the base namespace", function() {
            expect(registry.resolve("package.SomeClass")).toEqual("./package/SomeClass");
        });

        it("should be able to resolve package names given relative to the base namespace", function() {
            var result = registry.resolve("package.*");
            expect(result).toBeObject();
            expect(result).toHaveLength(2);
            expect(result["SomeClass"]).toEqual("./package/SomeClass");
            expect(result["SomeOtherClass"]).toEqual("./package/SomeOtherClass");
        });
    });

    describe("compiled suffix functionality", function() {
        beforeEach(function() {
            registry = new ProjectJsRegistry({
                "namespace": {
                    "base": "some.namespace",
                    "map": {
                        "some.namespace.package.SomeClass": "./package/SomeClass",
                        "some.namespace.package.*": [
                            "some.namespace.package.SomeClass"
                        ]
                    },
                    "dependencies": {
                        "dependency": "./lib/dependency/main"
                    },
                    "aliases": {
                        "SomeClass": "some.namespace.package.SomeClass"
                    }
                }
            }, {
                "compileSuffix": ".tmp",
                "addCompileSuffix": true
            });
        });

        it("should be added to the end of file paths", function() {
           expect(registry.resolve("some.namespace.package.SomeClass")).toEqual("./package/SomeClass.tmp"); 
        });

        it("should be added to the end of package file paths", function() {
            var result = registry.resolve("package.*");
            expect(result).toBeObject();
            expect(result).toHaveLength(1);
            expect(result["SomeClass"]).toEqual("./package/SomeClass.tmp");
        });

        it("should work with aliases", function() {
            expect(registry.resolve("SomeClass")).toEqual("./package/SomeClass.tmp");
        });

        it("should NOT be added to the end of dependency file paths", function() {
            expect(registry.resolve("dependency")).toEqual("./lib/dependency/main");
        });

        it("should be accessible and settable via isAddingCompileSuffix", function() {
            expect(registry.isAddingCompileSuffix).toBeDefined();
            expect(registry.isAddingCompileSuffix()).toBe(true);
            registry.isAddingCompileSuffix(false);
            expect(registry.isAddingCompileSuffix()).toBe(false);
        });
    });

    describe("source directory support", function() {
        beforeEach(function() {
            registry = new ProjectJsRegistry({
                "namespace": {
                    "base": "some.namespace",
                    "map": {
                        "some.namespace.package.SomeClass": "./package/SomeClass",
                        "some.namespace.package.*": [
                            "some.namespace.package.SomeClass"
                        ]
                    },
                    "dependencies": {
                        "dependency": "./lib/dependency"
                    },
                    "aliases": {
                        "SomeClass": "some.namespace.package.SomeClass"
                    }
                },
                "srcDir": "./src",
            }, {
                "addSrcDir": true
            });
        });

        it("should be included in class file paths", function() {
            expect(registry.resolve("SomeClass")).toEqual("./src/package/SomeClass");
        });

        it("should be added to the end of package file paths", function() {
            var result = registry.resolve("package.*");
            expect(result).toBeObject();
            expect(result).toHaveLength(1);
            expect(result["SomeClass"]).toEqual("./src/package/SomeClass");
        });

        it("should be accessible and settable via isAddingSrcDir", function() {
            expect(registry.isAddingSrcDir).toBeDefined();
            expect(registry.isAddingSrcDir()).toBe(true);
            registry.isAddingSrcDir(false);
            expect(registry.isAddingSrcDir()).toBe(false);
            expect(registry.resolve("SomeClass")).toEqual("./package/SomeClass");
        });
    });

    describe("getClassNameFromFilePath", function() {
        beforeEach(function() {
            registry = new ProjectJsRegistry({
                "namespace": {
                    "base": "some.namespace",
                    "map": {
                        "some.namespace.package.SomeClass": "./package/SomeClass",
                        "some.namespace.package.SomeOtherClass": "./package/SomeOtherClass",
                        "some.namespace.package.*": [
                            "some.namespace.package.SomeClass",
                            "some.namespace.package.SomeOtherClass"
                        ]
                    },
                    "dependencies": {
                        "dependency": "./lib/dependency"
                    },
                    "aliases": {
                        "SomeClass": "some.namespace.package.SomeClass",
                        "SomeOtherClass": "some.namespace.package.SomeOtherClass",
                        "SomePackage": "some.namespace.package.*"
                    }
                },
                "srcDir": "./src"
            }, {
                "addSrcDir": true
            });
        });
        
        it("should be able to find the class name of the given file, provided it is registered", function() {
            var file1 = "/Users/someuser/someproject/src/package/SomeClass.js",
                file2 = "/Users/someuser/someproject/src/package/SomeOtherClass.js",
                file3 = "/Users/someuser/someproject/src/package/SomeUnregisteredClass.js";
            expect(registry.getClassNameFromFilePath(file1)).toEqual("some.namespace.package.SomeClass");
            expect(registry.getClassNameFromFilePath(file2)).toEqual("some.namespace.package.SomeOtherClass");
            expect(registry.getClassNameFromFilePath(file3)).toBeNull();
        });
    });
});