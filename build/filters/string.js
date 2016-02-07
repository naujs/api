'use strict';

var _ = require('lodash');

module.exports = function (value) {
  if (!value) {
    return undefined;
  }

  return _.toString(value);
};