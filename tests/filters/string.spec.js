var string = require('../../build/filters').string
  , _ = require('lodash');

var values = {
  1: '1'
};

describe('string', () => {
  _.each(values, (expected, testValue) => {
    it(`should convert ${testValue} to ${expected}`, () => {
      expect(string(testValue)).toEqual(expected);
    });
  });

  it('should return undefined as it is', () => {
    expect(string(undefined)).toEqual(undefined);
  });
});
