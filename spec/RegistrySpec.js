describe("ProjectJsRegistry", function() {
    var ProjectJsRegistry = require("../lib/registry");
    var registry;

    describe("ProjectJsRegistry.resolve", function() {
        beforeEach(function() {
            registry = new ProjectJsRegistry({
                "base": "some.namespace",
                "map": {
                    "some.namespace.package.SomeClass": "./package/SomeClass",
                    "some.namespace.package.SomeOtherClass": "./package/SomeOtherClass",
                    "some.namespace.package.*": [
                        "some.namespace.package.SomeClass",
                        "some.namespace.package.SomeOtherClass"
                    ],
                    "dependency": "./lib/dependency"
                },
                "aliases": {
                    "SomeClass": "some.namespace.package.SomeClass",
                    "SomeOtherClass": "some.namespace.package.SomeOtherClass",
                    "SomePackage": "some.namespace.package.*"
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

        it("should support unnamespaced dependencies", function() {
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

    describe("ProjectJsRegistry compiled suffix", function() {
        beforeEach(function() {
            registry = new ProjectJsRegistry({
                "base": "some.namespace",
                "map": {
                    "some.namespace.package.SomeClass": "./package/SomeClass",
                    "some.namespace.package.*": [
                        "some.namespace.package.SomeClass"
                    ],
                    "dependency": "./lib/dependency/main"
                },
                "aliases": {
                    "SomeClass": "some.namespace.package.SomeClass"
                },
                "useCompileSuffix": true
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
    });
});