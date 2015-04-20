module.exports = (function() {

/**
 * ProjectJsParser
 * Parses and verifies a project.json file before handing
 * back the data in a useable form.
 */

var fs = require('fs');
var _ = require('underscore');
var ownVersion = require('own-version');
var vc = require('version_compare');
var ProjectJsRegistry = require('./registry');
var ProjectJsFile = require('./projectfile');
var util = require('./util');

var ProjectJsParser = function() {

    /**
     * Parses a valid json string
     * @param  {String} json 
     * @return {Object}
     */
    this.parse = function(json) {
        if (_.isUndefined(json) || _.isNull(json) || _.isEmpty(json)) {
            throw new ReferenceError("Project.json is empty!");
        }
        return JSON.parse(json);
    };

    /**
     * Verifies the data of a project.json file. Throws an error
     * if an issue is found.
     * @param  {Object} parsed A parsed project.json file
     * @return {Boolean}       Returns true if all tests passed
     */
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
            throw new ReferenceError("namespace.base is not defined");
        }
        if (!_.has(parsed.namespace, 'map')) {
            throw new ReferenceError("namespace.map is not defined");
        }

        // check dependencies (if exists)
        if (_.has(parsed.namespace, "dependencies") &&  (!_.isObject(parsed.namespace.dependencies) || 
            _.isArray(parsed.namespace.dependencies) || _.isString(parsed.namespace.dependencies))) {
            throw new Error("namespace.dependencies must be a map");
        }

        // check aliases (if exists)
        if (_.has(parsed.namespace, "aliases") &&  (!_.isObject(parsed.namespace.aliases) || 
            _.isArray(parsed.namespace.aliases) || _.isString(parsed.namespace.aliases))) {
            throw new Error("namespace.aliases must be a map");
        }

        return true;
    };

    /**
     * Creates ProjectJsRegistry object from valid namespace
     * @param  {Object} namespace A valid namespace object
     * @return {ProjectJsRegistry}
     */
    this.createRegistry = function(namespace) {
        var registry = new ProjectJsRegistry(namespace);
        // create package listings
        var nsClasses = _.keys(namespace.map),
            len = nsClasses.length,
            packName;
        for (var i = 0; i < len; i++) {
            packName = util.getPackageName(nsClasses[i]);
            if (!_.isNull(packName) && registry.has(packName)) {
                registry.get(packName).push(nsClasses[i]);
            } else if (!_.isNull(packName)) {
                registry.set(packName, [ nsClasses[i] ]);
            }
        }; 
        return registry;
    };

    /**
     * Loads registry from a project file
     * @param  {String} projectFilePath Valid path to project.json file
     * @return {ProjectJsRegistry}
     */
    this.loadRegistry = function(projectFilePath) {
        var projectJson = fs.readFileSync(projectFilePath);
        var projectInfo = this.parse(projectJson);
        if (this.verify(projectInfo)) {
            return this.createRegistry(projectInfo.namespace);
        }
        return null;
    };

    this.loadProjectFile = function(projectFilePath) {
        var projectJson = fs.readFileSync(projectFilePath);
        var projectInfo = this.parse(projectJson);
        if (this.verify(projectInfo)) {
            return new ProjectJsFile(projectInfo);
        }
        return null;
    };
}

return ProjectJsParser;

})();