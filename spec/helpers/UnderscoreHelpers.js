var _ = require('underscore');

/////////////////////////////////////////////////////////
/// Jasmine Match Wrappers Around Underscore Functions //
/////////////////////////////////////////////////////////

beforeEach(function() {
    jasmine.addMatchers({
        toBeFunction: function(util, customEqualityTesters) {
            return {
                compare: function(actual) {
                    var result = {};
                    result.pass = util.equals(_.isFunction(actual), true, customEqualityTesters);
                    return result;
                }
            }
        },
        toBeArray: function(util, customEqualityTesters) {
            return {
                compare: function(actual) {
                    var isPass = util.equals(_.isArray(actual), true, customEqualityTesters);
                    return {
                        pass: isPass
                    };
                }
            };
        },
        toBeObject: function(util, customEqualityTesters) {
            return {
                compare: function(actual) {
                    var isPass = util.equals(_.isObject(actual), true, customEqualityTesters);
                    return {
                        pass: isPass
                    };
                }
            };
        },
        toHave: function() {
            return {
                compare: function(actual, expected) {
                    return {
                        pass: _.has(actual, expected)
                    };
                }
            };
        },
        toNotHave: function() {
            return {
                compare: function(actual, expected) {
                    return {
                        pass: !_.has(actual, expected)
                    };
                }
            };
        },
        toHaveLength: function(util, customEqualityTesters) {
            return {
                compare: function(actual, expected) {
                    var length;
                    if (_.isArray(actual) || _.isString(actual)) {
                        length = actual.length;
                    } else if (_.isObject(actual)) {
                        length = _.keys(actual).length;
                    } else if (_.isNumber(actual)) {
                        length = String(actual).length;
                    } else {
                        throw new Error("Given item does not have an applicable length property!");
                    }
                    return {
                        pass: util.equals(length, expected, customEqualityTesters)
                    };
                }
            };
        }
    });
});