var _ = require('lodash');

module.exports = (value) => {
  try {
    value = JSON.parse(value);

    if (!_.isObject(value)) {
      return undefined;
    }

    return value;
  } catch (e) {
    return undefined;
  }
};
