
var ProjectRunner = require('./lib/runner');

var runner = new ProjectRunner();

var path = process.cwd() + "/example/";

runner.loadAndRun(path);

