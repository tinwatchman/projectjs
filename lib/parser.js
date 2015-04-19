module.exports = (function() {

/**
 * ProjectJsParser
 * Parses and verifies a project.json file before handing
 * back the data in a useable form.
 */

var ProjectJsParser = function() {
    this.parse = function(json) {
        return JSON.parse(json);
    };

    this.verify = function(parsedJson) {
        
    };
}

return ProjectJsParser;

})();