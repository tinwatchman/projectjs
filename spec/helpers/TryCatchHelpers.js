var _ = require('underscore');

beforeEach(function() {
    var parseOptions = function(options) {
        var funct,
            context = null,
            params = [],
            descript = "function";
        if (_.has(options, 'function') && _.isFunction(options['function'])) {
            funct = options['function'];
        } else {
            throw new ReferenceError("Function is not defined");
        }
        if (_.has(options, 'context') && !_.isNull(options['context'])) {
            context = options['context'];
        }
        if (_.has(options, 'parameters') && _.isArray(options['parameters'])) {
            params = options['parameters'];
        } else if (_.has(options, 'parameters')) {
            // allow single strings or object parameters
            params.push(options['parameters']); 
        }
        if (_.has(options, 'description')) {
            descript = options['description'];
        }
        return {
            'function': funct,
            'context': context,
            'parameters': params,
            'description': descript
        };
    };

    var isAnErrorType = function(type) {
        if (typeof type !== 'function') {
            return false;
        }

        var Surrogate = function() {};
        Surrogate.prototype = type.prototype;
        return (new Surrogate()) instanceof Error;
    };

    jasmine.addMatchers({
        toThrowAnError: function() {
            return {
                compare: function(actual) {
                    var opts = parseOptions(actual),
                        err;
                    try {
                        opts['function'].apply(opts.context, opts.parameters);
                    } catch (e) {
                        err = e;
                    }
                    if (_.isUndefined(err)) {
                        return {
                            pass: false,
                            message: function() {
                                return 'Expected ' + opts['description'] + ' to throw an Error.';
                            }
                        }
                    }
                    return {
                        pass: true,
                        message: function() {
                            return 'Expected ' + opts['description'] + ' to not throw an Error.';
                        }
                    };
                }
            };
        },
        toThrowAnErrorOfType: function() {
            return {
                compare: function(actual, expected) {
                    var opts = parseOptions(actual),
                        errorType = expected,
                        isErrorThrown = false,
                        err;

                    if (_.isUndefined(errorType) || _.isNull(errorType)) {
                        throw new ReferenceError("Error type is expected!");
                    }

                    try {
                        opts['function'].apply(opts.context, opts.parameters);
                    } catch (e) {
                        isErrorThrown = true;
                        err = e;
                    }

                    if (!isErrorThrown) {
                        return {
                            pass: false,
                            message: 'Expected ' + opts['description'] + ' to throw an Error.'
                        };
                    }

                    if (!(err instanceof Error) && isAnErrorType(errorType)) {
                        return {
                            pass: false,
                            message: function() {
                                return 'Expected ' + opts['description'] + ' to throw an Error, but it threw ' + jasmine.pp(err) + ' instead.';
                            }
                        };
                    }

                    if (err instanceof errorType) {
                        return {
                            pass: true,
                            message: function() {
                                var errorTypeDescriptor = jasmine.fnNameFor(errorType);
                                return 'Expected ' + opts['description'] + ' not to throw ' + errorTypeDescriptor;
                            }
                        };
                    }

                    return {
                        pass: false,
                        message: function() {
                            return 'Expected ' + opts['description'] + ' to throw an Error of type ' + jasmine.fnNameFor(errorType);
                        }
                    };
                }
            };
        }
    });
});