
describe("ProjectJsCompiler", function() {
    var ProjectJsCompiler = require("../lib/compiler");

    describe("ProjectJsCompiler.addClassBoilerplate", function() {
        var compiler;
        var use;

        beforeEach(function() {
            compiler = new ProjectJsCompiler();
            use = jasmine.createSpy("use");
        });

        it("should return class code with an expected format", function() {
            var basicBoilerplate = compiler.addClassBoilerplate("SampleClass", "%%CODE%%");
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
            var boilerCode = compiler.addClassBoilerplate("SampleClass", sampleCode);
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

    describe("ProjectJsCompiler.findUses", function() {
        var compiler;

        beforeEach(function() {
            compiler = new ProjectJsCompiler();
        });

        it("should exist", function() {
            expect(compiler.findUses).toBeDefined();
        });

        it("should return a list of use() invocations within a given code string, with the request strings singled out", function() {
            var sampleUses = "var class1 = use('some.namespace.class');\r\n\r\n" +
                "var class2 =use('some.namespace.class2');\r\n" +
                "var class3 = use(\"some.namespace.package.class3\");\r\n\n\n";
            var list = compiler.findUses(sampleUses);
            expect(list).toBeArray();
            expect(list.length).toEqual(3);
            expect(list[0].name).toEqual('some.namespace.class');
            expect(list[1].name).toEqual('some.namespace.class2');
            expect(list[2].name).toEqual('some.namespace.package.class3');
        });

        it("should recognize package names", function() {
            var list = compiler.findUses("var pack = use('some.namespace.package.*')");
            expect(list).toBeArray();
            expect(list.length).toEqual(1);
            expect(list[0].name).toEqual('some.namespace.package.*');
        });

        it("should not be fooled by functions that look like use", function() {
            var sample = "var someClass = Use('some.namespace.Use'); var someThingElse = my_use('some.namespace.my_use');";
            expect(compiler.findUses(sample).length).toEqual(0);
        });

        it("should allow special characters to appear in use statements -- because why not -- but not whitespace or parens", function() {
            var sampleUses = "var class1 = use('some.name_$pace.cl@ss');\r\n\r\n" +
                "var class2 = use('s0me.#Namespace.c!assTwo');\r\n" +
                "var pack = use('%.*');\r\n\n\n" +
                "var class3 = use('some.namespace.class Three');\r\n" + 
                "var class4 = use('some.namespace\n.classFour');\r\n" +
                "var class5 = use('some.namespace().classFive');";
            var list = compiler.findUses(sampleUses);
            expect(list).toBeArray();
            expect(list.length).toEqual(3);
            expect(list[0].name).toEqual('some.name_$pace.cl@ss');
            expect(list[1].name).toEqual('s0me.#Namespace.c!assTwo');
            expect(list[2].name).toEqual('%.*');
        });
    });
    
});