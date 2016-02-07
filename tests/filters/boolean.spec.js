var bool = require('../../build/filters').boolean
  , _ = require('lodash');

var values = {
  'true': true,
  'false': false,
  '1': true,
  '0': false,
  '': false,
  'any': true
};

describe('bool', () => {
  _.each(values, (expected, testValue) => {
    it(`should convert ${testValue} to ${expected}`, () => {
      expect(bool(testValue)).toEqual(expected);
    });
  });

  it('should return undefined as it is', () => {
    expect(bool(undefined)).toEqual(undefined);
  });
});
