var _ = require('lodash');

module.exports = (value) => {
  if (!value) {
    return undefined;
  }

  return _.toString(value);
};
