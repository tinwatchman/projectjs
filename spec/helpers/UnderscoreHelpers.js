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
        }
    });
});