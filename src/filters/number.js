var _ = require('lodash');

module.exports = (value) => {
  if (!value) {
    return undefined;
  }

  value = _.toNumber(value);

  if (_.isNaN(value)) {
    return undefined;
  }

  return value;
};
