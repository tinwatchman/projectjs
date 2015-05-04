
describe("ProjectJsCompiler", function() {
    var ProjectJsCompiler = require("../lib/compiler");
    var ProjectJsRegistry = require("../lib/registry");
    var compiler;

    describe("addClassBoilerplate", function() {
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

    describe("replaceUses", function() {
        var registry;

        beforeEach(function() {
            compiler = new ProjectJsCompiler();
            registry = new ProjectJsRegistry({
                "namespace": {
                    "base": "some.namespace",
                    "map": {
                        "some.namespace.Class": "./Class",
                        "some.namespace.OtherClass": "./OtherClass",
                        "some.namespace.*": [
                            "some.namespace.Class",
                            "some.namespace.OtherClass"
                        ]
                    }
                },
                "srcDir": "./src"
            });
        });

        it("should exist", function() {
            expect(compiler.replaceUses).toBeDefined();
            expect(compiler.replaceUses).toBeFunction();
        });

        it("should replace a use invocation within a code block with a standard require", function() {
            var code = "var myClass = use('some.namespace.Class');";
            expect(compiler.replaceUses('.', code, registry)).toEqual("var myClass = require('./Class');");
        });

        it("should replace a use package request with a package map", function() {
            var code = "var myPackage = use('some.namespace.*');";
            var result = compiler.replaceUses('.', code, registry);
            expect(result).toEqual("var myPackage = { 'Class': require('./Class'), 'OtherClass': require('./OtherClass') };");
        });

        it("should ignore src folder settings", function() {
            var code = "var myClass = use('some.namespace.Class');";
            registry.isAddingSrcDir(true);
            expect(compiler.replaceUses('.', code, registry)).not.toEqual("var myClass = require('./src/Class');");
        });
    });

    describe("getRelativeCodePath", function() {
        beforeEach(function() {
            compiler = new ProjectJsCompiler();
        });

        it("should return a relative path from one file to another", function() {
            var fromFile = "/Users/someuser/someproject/somedir/file1.js",
                toFile = "/Users/someuser/someproject/anotherdir/file2",
                r = compiler.getRelativeCodePath(fromFile, toFile);
            expect(r).toEqual("../anotherdir/file2");
        });

        it("should return the path Unix-style, even on Windows", function() {
            var fromFile = "C:\\Users\\someuser\\someproject\\somedir\\file1",
                toFile = "C:\\Users\\someuser\\someproject\\anotherdir\\subdir\\file2",
                r = compiler.getRelativeCodePath(fromFile, toFile);
            expect(r).toEqual("../anotherdir/subdir/file2");
        });
    });
});