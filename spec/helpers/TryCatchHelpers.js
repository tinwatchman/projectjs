var _ = require('underscore');

beforeEach(function() {
    jasmine.addMatchers({
        toThrowWith: function(util, customEqualityTesters) {
            return {
                compare: function(actual, args) {
                    var params = [],
                        context = null,
                        errorType,
                        err;
                    if (_.has(args, 'parameters')) {
                        params = args.parameters;
                        if (_.has(args, 'errorType')) {
                            errorType = args.errorType;
                        }
                        if (_.has(args, 'context')) {
                            context = args.context;
                        }
                    } else if (_.isArray(args)) {
                        params = args;
                    } else {
                        params.push(args);
                    }
                    try {
                        actual.apply(context, params);
                    } catch (e) {
                        err = e;
                    }
                    var isThrown = util.equals(_.isUndefined(err), false, customEqualityTesters);
                    var isErrorType = true;
                    if (!_.isUndefined(errorType)) {
                        isErrorType = util.equals((err instanceof errorType), true, customEqualityTesters);
                    }
                    // create result
                    var result = {};
                    result.pass = (isThrown && isErrorType);
                    if (!result.pass && !isThrown) {
                        result.message = "Expected function to throw Error";
                    } else if (!result.pass && isThrown && !isErrorType) {
                        result.message = "Expected function to throw error of type " + Object.prototype.toString.call(errorType);
                    }
                    return result;
                }
            }
        };
    });
});