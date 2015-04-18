var _ = use('underscore');

var Message = function(args) {
    this.userId = _.has(args, 'userId') ? args['userId'] : null;
    this.time = _.has(args, 'time') ? args['time'] : null;
    this.text = _.has(args, 'text') ? args['text'] : null;
    this.tags = _.has(args, 'tags') ? args['tags'] : [];
};