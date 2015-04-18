////////////////////////////////////////////////////
/// Jasmine Test Spec for ProjectJsUtil functions //
////////////////////////////////////////////////////

describe("ProjectUtil", function() {
    var util = require("../lib/util");

    it("needs to be able to tell what is, and is not, a request string for a package", function() {
        expect(util.isPackageName("some.namespace.*")).toEqual(true);
        expect(util.isPackageName("some.namespace.class")).toEqual(false);
        expect(util.isPackageName("*")).toEqual(true);
    });

    it("needs to be able to pull out the name of a request string's package", function() {
        expect(util.getPackage("some.namespace.class")).toEqual("some.namespace");
    });

    it("needs to be able to pull out just the short name of the class from a request string", function() {
        expect(util.getClassName("some.namespace.class")).toEqual("class");
        expect(util.getClassName("some.namespace.UppercaseClass")).toEqual("UppercaseClass");
        expect(util.getClassName("some.namespace.More_Complex_className")).toEqual("More_Complex_className");
    });

    it("needs to be able to tell when a given filepath ends with a .js file extension", function() {
        expect(util.hasJsFileExtension("/Users/someone/some/file/path/file.js")).toEqual(true);
        expect(util.hasJsFileExtension("C:\\Users\\someone\\some\\file\\path\\file.js")).toEqual(true);
        expect(util.hasJsFileExtension("/Users/someone/some/file/path/file.txt")).toEqual(false);
        expect(util.hasJsFileExtension("/Users/someone/some/file/path/file.js.txt")).toEqual(false);
        expect(util.hasJsFileExtension("/Users/someone/some/file/path")).toEqual(false);
    });

});