describe("ProjectJsParser", function() {
    var _ = require("underscore");
    var ProjectJsParser = require("../lib/parser");
    var ProjectJsRegistry = require("../lib/registry");
    var parser;

    beforeEach(function() {
        parser = new ProjectJsParser();
    });

    describe("ProjectJsParser.parse", function() {
        it("should exist", function() {
            expect(parser.parse).toBeDefined();
            expect(parser.parse).toBeFunction();
        });

        it("should return a valid object when given a JSON string", function() {
            var obj = { 
                "namespace": {},
                "schema": {}
            };
            var json = JSON.stringify(obj);
            var parsedObj = parser.parse(json);
            expect(parsedObj).toEqual(obj);
            expect(parsedObj).toHave('namespace');
            expect(parsedObj).toHave('schema');
        });
    });

    describe("ProjectJsParser.verify", function() {
        it("should exist", function() {
            expect(parser.verify).toBeDefined();
            expect(parser.verify).toBeFunction();
        });

        // project namespace
        
        it("should throw an error when namespace attribute is undefined", function() {
            expect({
                'function': parser.verify,
                'context': parser,
                'parameters': {
                    "schema": { "name": "projectjs", "version": "^0.0.1" }
                }
            }).toThrowAnErrorOfType(ReferenceError);
        });

        it("should throw an error when namespace.base is not defined or empty", function() {
            expect({
                'function': parser.verify,
                'context': parser,
                'parameters': {
                    "namespace": {
                        "map": {}
                    },
                    "schema": { "name": "projectjs", "version": "^0.0.1" }
                }
            }).toThrowAnErrorOfType(ReferenceError);

            expect({
                'function': parser.verify,
                'context': parser,
                'parameters': {
                    "namespace": {
                        "base": "",
                        "map": {}
                    },
                    "schema": { "name": "projectjs", "version": "^0.0.1" }
                }
            }).toThrowAnError();
        });

        it("should throw an error when namespace.map is not defined", function() {
            expect({
                'function': parser.verify,
                'context': parser,
                'parameters': {
                    "namespace": {
                        "base": "some.namespace"
                    },
                    "schema": { "name": "projectjs", "version": "^0.0.1" }
                }
            }).toThrowAnErrorOfType(ReferenceError);
        });

        // project schema
        
        it("should throw an error when project schema is undefined", function() {
            expect({
                'function': parser.verify,
                'context': parser,
                'parameters': {
                    "namespace": { "base": "some.namespace", "map": {} }
                }
            }).toThrowAnErrorOfType(ReferenceError);
        });

        it("should throw an error when project schema name is undefined or does not match", function() {
            expect({
                'function': parser.verify,
                'context': parser,
                'parameters': {
                    "namespace": { "base": "some.namespace", "map": {} },
                    "schema": {
                        "version": "1.0.0"
                    }
                }
            }).toThrowAnError();

            expect({
                'function': parser.verify,
                'context': parser,
                'parameters': {
                    "namespace": { "base": "some.namespace", "map": {} },
                    "schema": {
                        "name": "",
                        "version": "1.0.0"
                    }
                }
            }).toThrowAnError();

            expect({
                'function': parser.verify,
                'context': parser,
                'parameters': {
                    "namespace": { "base": "some.namespace", "map": {} },
                    "schema": {
                        "name": "someotherschema",
                        "version": "1.0.0"
                    }
                }
            }).toThrowAnError();
        });

        it("should throw an error when project schema version is undefined or does not match the current version", function() {
            expect({
                'function': parser.verify,
                'context': parser,
                'parameters': {
                    "namespace": { "base": "some.namespace", "map": {} },
                    "schema": {
                        "name": "projectjs"
                    }
                }
            }).toThrowAnError();

            expect({
                'description': "non-matching schema version",
                'function': parser.verify,
                'context': parser,
                'parameters': {
                    "namespace": { "base": "some.namespace", "map": {} },
                    "schema": {
                        "name": "projectjs",
                        "version": "255.0.0"
                    }
                }
            }).toThrowAnError();
        });

        it("should throw an error if dependencies is defined but is not a map", function() {
            expect({
                'function': parser.verify,
                'context': parser,
                'description': "dependencies as array",
                'parameters': {
                    "namespace": { 
                        "base": "some.namespace", 
                        "map": {},
                        "dependencies": []
                    },
                    "schema": {
                        "name": "projectjs",
                        "version": "0.0.1"
                    }
                }
            }).toThrowAnError();
        });

        it("should pass a project spec map when it is valid", function() {
            expect({
                'function': parser.verify,
                'context': parser,
                'parameters': {
                    "namespace": { 
                        "base": "some.namespace", 
                        "map": {} 
                    },
                    "schema": {
                        "name": "projectjs",
                        "version": "0.0.1"
                    }
                }
            }).not.toThrowAnError();
        });
    });

    describe("ProjectJsParser.createRegistry", function() {
        it("should exist", function() {
            expect(parser.createRegistry).toBeDefined();
            expect(parser.createRegistry).toBeFunction();
        });

        it("should return a valid ProjectJsRegistry object", function() {
            var registry = parser.createRegistry({
                "base": "some.namespace",
                "map": {},
                "dependencies": {},
                "aliases": {}
            });
            expect(registry).not.toBeNull();
            expect(registry.toString()).toBe("[object ProjectJsRegistry]");
        });

        it("should create listings for packages", function() {
            var registry = parser.createRegistry({
                "base": "some.namespace",
                "map": {
                    "some.namespace.Class": "./Class"
                }
            });
            expect(registry.resolve("some.namespace.*")).not.toBeNull();
        });
    });
});