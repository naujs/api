'use strict';

var _ = require('lodash');

var SPECIAL_CASES = ['true', 'false', '1', '0'];

module.exports = function (value) {
  if (value == undefined) {
    return value;
  }

  value = _.toString(value);

  if (_.indexOf(SPECIAL_CASES, value.toLowerCase()) !== -1) {
    return !!JSON.parse(value);
  }

  return !!value;
};