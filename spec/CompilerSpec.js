
describe("ProjectCompiler", function() {
    var ProjectCompiler = require("../lib/compiler");

    describe("ProjectCompiler.getClassBoilerplate", function() {
        var compiler;
        var use;

        beforeEach(function() {
            compiler = new ProjectCompiler();
            use = jasmine.createSpy("use");
        });

        it("should return class code with an expected format", function() {
            var basicBoilerplate = compiler.getClassBoilerplate("SampleClass", "%%CODE%%");
            expect(basicBoilerplate).toMatch(/\%\%CODE\%\%/);
            expect(basicBoilerplate).toMatch(/return SampleClass/);
        });

        it("should return valid class code that will return a valid module", function() {
            var getModule = function(moduleCode) {
                // override global module
                var module = {};
                eval(moduleCode);
                return module;
            };
            var sampleCode = "var sampleImport = use('some.namespace.class');" +
                "var SampleClass = function() {" +
                "    this.property = 'propertyValue';" +
                "    this.method = function(a, b) {" +
                "        return a + b;" +
                "    };" +
                "};";
            var boilerCode = compiler.getClassBoilerplate("SampleClass", sampleCode);
            var sampleModule = getModule(boilerCode);
            expect(sampleModule).toBeDefined();
            expect(sampleModule).not.toBeNull();
            expect(sampleModule.exports).toBeDefined();
            expect(use).toHaveBeenCalled();
            expect(use).toHaveBeenCalledWith('some.namespace.class');
            var sampleInst = new sampleModule.exports();
            expect(sampleInst).toBeDefined();
            expect(sampleInst).not.toBeNull();
            expect(sampleInst.property).toEqual('propertyValue');
            expect(sampleInst.method).toBeDefined();
            expect(sampleInst.method(0,1)).toEqual(1);
        });
    });
});