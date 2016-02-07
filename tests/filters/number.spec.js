var number = require('../../build/filters').number
  , _ = require('lodash');

var values = {
  '1': 1,
  '-1': -1,
  '1.1': 1.1,
  '-1.1': -1.1,
  'abc': undefined
};

describe('number', () => {
  _.each(values, (expected, testValue) => {
    it(`should convert ${testValue} to ${expected}`, () => {
      expect(number(testValue)).toEqual(expected);
    });
  });

  it('should return undefined as it is', () => {
    expect(number(undefined)).toEqual(undefined);
  });
});
