module.exports = (function() {

    var _ = require('underscore');

    /**
     * ProjectJsFile - Just a wrapper around a project.json file.
     * @param {Object} data    Object representing a parsed project.json file
     * @param {String} rootDir The absolute path of the root directory of the project
     */
    var ProjectJsFile = function(args) {
        var data = args.data,
            rootDir = _.has(args, 'rootDir') ? args.rootDir : null;

        this.hasRootDir = function() {
            return (!_.isUndefined(rootDir) && !_.isNull(rootDir) && !_.isEmpty(rootDir));
        };

        this.getRootDir = function() {
            return rootDir;
        };

        this.setRootDir = function(value) {
            rootDir = value;
        };

        this.getNamespace = function() {
            return data['namespace'];
        };

        this.cloneNamespace = function() {
            return {
                "base": data.namespace.base,
                "map": _.clone(data.namespace.map),
                "dependencies": _.has(data.namespace, "dependencies") ? _.clone(data.namespace.dependencies) : {},
                "aliases": _.has(data.namespace, "aliases") ? _.clone(data.namespace.aliases) : {}
            };
        };

        this.getBaseNamespace = function() {
            return data['namespace']['base'];
        };

        this.getSchema = function() {
            return data['schema'];
        };

        this.hasSrcDir = function() {
            return (_.has(data, "srcDir") && !_.isNull(data["srcDir"]) && !_.isEmpty(data["srcDir"]));
        };

        this.getSrcDir = function() {
            return data["srcDir"];
        };

        this.setSrcDir = function(value) {
            data["srcDir"] = value;
        };

        this.hasBuildDir = function() {
            return (_.has(data, "buildDir") && !_.isNull(data["buildDir"]) && !_.isEmpty(data["buildDir"]));
        };

        this.getBuildDir = function() {
            return data["buildDir"];
        };

        this.setBuildDir = function(value) {
            data["buildDir"] = value;
        };

        this.hasStart = function() {
            return (_.has(data, "start") && !_.isEmpty(data["start"]));
        };

        this.getStart = function() {
            return data["start"];
        };

        this.setStart = function(value) {
            data["start"] = value;
        }

        this.addClass = function(className, classPath) {
            data['namespace'].map[className] = classPath;
        };

        this.removeClass = function(className) {
            delete data['namespace'].map[className];
        };

        this.addDependency = function(name, filePath) {
            data['namespace'].dependencies[name] = filePath;
        };

        this.addAlias = function(alias, className) {
            data['namespace'].aliases[alias] = className;
        };

        this.hasAlias = function(alias) {
            return _.has(data['namespace'].aliases, alias); 
        };

        this.removeAlias = function(alias) {
            delete data['namespace'].aliases[alias];
        };

        this.toJSON = function() {
            return JSON.stringify(data, null, 4);
        };
    };
    ProjectJsFile.prototype = {};

    return ProjectJsFile;
})();