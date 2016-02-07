var _ = require('lodash');

const SPECIAL_CASES =   [
  'true',
  'false',
  '1',
  '0'
];

module.exports = (value) => {
  if (value == undefined) {
    return value;
  }

  value = _.toString(value);

  if (_.indexOf(SPECIAL_CASES, value.toLowerCase()) !== -1) {
    return !!JSON.parse(value);
  }

  return !!value;
};
