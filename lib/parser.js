module.exports = (function() {

/**
 * ProjectJsParser
 * Parses and verifies a project.json file before handing
 * back the data in a useable form.
 */

var _ = require('underscore');
var ownVersion = require('own-version');
var vc = require('version_compare');

var ProjectJsParser = function() {
    this.parse = function(json) {
        return JSON.parse(json);
    };

    this.verify = function(parsed) {
        // check schema
        if (!_.has(parsed, 'schema')) {
            throw new ReferenceError("Project schema is not defined");
        }
        if (!_.has(parsed.schema, 'name') || _.isEmpty(parsed.schema.name)) {
            throw new Error("Project schema name is not defined");
        }
        if (!_.has(parsed.schema, 'version') || _.isEmpty(parsed.schema.version)) {
            throw new Error("Project schema version is not defined");
        }

        if (parsed.schema.name !== "projectjs" && parsed.schema.name !== "project.js") {
            throw new Error("Schema mismatch -- this project was not created by or for projectjs");
        }
        var version = ownVersion.sync();
        if (!vc.matches(version, parsed.schema.version) && vc.compare(version, parsed.schema.version) < 0) {
            throw new Error("Schema version mismatch -- this project was created for a later version of projectjs");
        }

        // check namespace
        if (!_.has(parsed, 'namespace')) {
            throw new ReferenceError("Namespace is not defined");
        }
        if (!_.has(parsed.namespace, 'base') || _.isEmpty(parsed.namespace.base)) {
            throw new ReferenceError("Namespace.base is not defined");
        }
        if (!_.has(parsed.namespace, 'map')) {
            throw new ReferenceError("Namespace.map is not defined");
        }

        return true;
    };
}

return ProjectJsParser;

})();