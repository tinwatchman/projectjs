describe("ProjectJsFile", function() {
    var ProjectJsFile = require('../lib/projectfile');

    var projectFile;

    describe("cloneNamespace", function() {
        beforeEach(function() {
            projectFile = new ProjectJsFile({
                "data": {
                    "namespace": {
                        "base": "my.project",
                        "map": {
                            "my.project.Application": "./Application"
                        },
                        "dependencies": {
                            "dependency": "./lib/dependency.min"
                        },
                        "aliases": {}
                    }
                }
            });
        });

        it("should exist", function() {
            expect(projectFile.cloneNamespace).toBeDefined();
            expect(projectFile.cloneNamespace).toBeFunction();
        });

        it("should produce a clone of namespace, not just pass by reference", function() {
            var clone = projectFile.cloneNamespace();
            expect(clone).not.toBe(projectFile.getNamespace());
            expect(clone.map).not.toBe(projectFile.getNamespace().map);
            expect(clone.dependencies).not.toBe(projectFile.getNamespace().dependencies);
            expect(clone.aliases).not.toBe(projectFile.getNamespace().aliases);
            expect(clone.map).toHave("my.project.Application");
            expect(clone.dependencies).toHave("dependency");
        });
    });
});