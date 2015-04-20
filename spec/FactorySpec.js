describe("ProjectJsFactory", function() {
    var ProjectJsFactory = require('../lib/factory');
    var fs = require('fs-extra');
    var factory;

    beforeEach(function() {
        factory = new ProjectJsFactory();
    });

    describe("ProjectJsFactory.getTemplatePath", function() {
        it("should exist", function() {
            expect(factory.getTemplatePath).toBeDefined();
            expect(factory.getTemplatePath).toBeFunction();
        });

        it("should return the absolute path of a template", function() {
            var templatePath = factory.getTemplatePath("./templates/class.template.js");
            var actualPath = require.resolve("../lib/templates/class.template.js");
            expect(templatePath).toBeDefined();
            expect(templatePath).toEqual(actualPath);
        });
    });

    describe("ProjectJsFactory.getNewClassName", function() {
        it("should exist", function() {
            expect(factory.getNewClassName).toBeDefined();
            expect(factory.getNewClassName).toBeFunction();
        });

        it("should return a full class path based on the new file's location", function() {
            var projectRoot = '/Users/someone/something/dev/myproject',
                classDir = '/Users/someone/something/dev/myproject/mypackage',
                className = 'NewClass',
                baseNs = "my.project",
                expectedResult = "my.project.mypackage.NewClass";

            var result = factory.getNewClassName(className, classDir, projectRoot, baseNs);
            expect(result).toEqual(expectedResult);
        });

    });
});
