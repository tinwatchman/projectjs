var _ = use('underscore');

var User = function(args) {
    this.id = _.has(args, 'id') ? args['id'] : null;
    this.name = _.has(args, 'name') ? args['name'] : null;
    this.pass = _.has(args, 'pass') ? args['pass'] : null;
};