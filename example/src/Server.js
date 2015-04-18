var express = require('express');
var Config = use('projectjs.example.config.Config');


var Server = function() {
    var self = this,
        app = null,
        server = null;

    this.start = function() {
        app = express();
        app.get('/', function(req, res) {
            self.handle(req, res);
        });
        server = app.listen(Config.PORT, Config.HOSTNAME, function() {
            console.log("projectjs.example.Server listening on %s:%s", server.address().address, server.address().port);
        });
    };

    this.handle = function(request, response) {
        response.send("Hello world!");
    }
};