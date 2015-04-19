describe("ProjectJsParser", function() {
    var _ = require("underscore");
    var ProjectJsParser = require("../lib/parser");
    var parser;

    beforeEach(function() {
        parser = new ProjectJsParser();
    });

    describe("parsing behavior", function() {
        it("should have a method called parse", function() {
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

    describe("verification behavior", function() {
        it("should have a method named verify", function() {
            expect(parser.verify).toBeDefined();
            expect(parser.verify).toBeFunction();
        });
        // project namespace 
        it("should throw an error when namespace attribute is undefined", function() {
            expect(parser.verify).toThrowWith({
                'parameters': [
                    {
                        "schema": { "name": "projectjs", "version": "^0.0.1" }
                    }
                ],
                'errorType': ReferenceError
            });
        });
        it("should throw an error when namespace.base is not defined or empty", function() {
            expect(parser.verify).toThrowWith({ 
                'parameters': [
                    {
                        "namespace": {
                            "map": {}
                        },
                        "schema": { "name": "projectjs", "version": "^0.0.1" }
                    }
                ]
                'errorType': ReferenceError
            });
            expect(parser.verify).toThrowWith({
                "namespace": {
                    "base": "",
                    "map": {}
                },
                "schema": { "name": "projectjs", "version": "^0.0.1" }
            });
        });
        it("should throw an error when namespace.map is not defined", function() {
            expect(parser.verify).toThrowWith({
                'parameters': [
                    {
                        "namespace": {
                            "base": "some.namespace"
                        },
                        "schema": { "name": "projectjs", "version": "^0.0.1" }
                    }
                ],
                'errorType': ReferenceError
            });
        });
        // project schema
        it("should throw an error when project schema is undefined", function() {
            expect(parser.verify({
                "namespace": {
                    "base": "some.namespace",
                    "map": {}
                }
            })).toThrowError(ReferenceError);
        });
        it("should throw an error when project schema name is undefined or does not match", function() {
            expect(parser.verify({
                "namespace": {
                    "base": "some.namespace",
                    "map": {}
                },
                "schema": {
                    "version": "1.0.0"
                }
            })).toThrow();
            expect(parser.verify({
                "namespace": { "base": "some.namespace", "map": {} },
                "schema": {
                    "name": "someotherschema",
                    "version": "1.0.0"
                }
            })).toThrow();
        });
        it("should throw an error when project schema version is undefined or does not match the current version", function() {
            expect(parser.verify({
                "namespace": { "base": "some.namespace", "map": {} },
                "schema": {
                    "name": "projectjs"
                }
            })).toThrow();
            expect(parser.verify({
                "namespace": { "base": "some.namespace", "map": {} },
                "schema": {
                    "name": "projectjs",
                    "version": "0.0.0"
                }
            })).toThrow();
        });
        it("should pass a project spec map when it is valid", function() {
            expect(parser.verify({
                "namespace": {
                    "base": "some.namespace",
                    "map": {}
                },
                "schema": {
                    "name": "projectjs",
                    "version": "^0.0.1"
                }
            })).not.toThrow();
        });
    });
});