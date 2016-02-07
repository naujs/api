var object = require('../../build/filters').object;

describe('object', () => {
  it('should convert object', () => {
    expect(object('{"test": 1}')).toEqual({
      test: 1
    });
  });

  it('should convert array', () => {
    expect(object('[{"test": 1}, {"test": "2"}]')).toEqual([
      { test: 1 },
      { test: '2' }
    ]);
  });

  it('should return undefined as it is', () => {
    expect(object(undefined)).toEqual(undefined);
  });

  it('should return undefined if the value is not object', () => {
    expect(object('abc')).toEqual(undefined);
    expect(object('1')).toEqual(undefined);
    expect(object('true')).toEqual(undefined);
  });
});
