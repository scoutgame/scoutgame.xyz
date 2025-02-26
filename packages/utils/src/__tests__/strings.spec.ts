import { concatenateStringValues, isValidEmail, shortenHex } from '../strings';

describe('concatenateStringValues', () => {
  it('should concatenate all string values from the object into an array', () => {
    const input = {
      key1: 'hello',
      key2: 'world',
      key3: 42,
      key4: 'typescript'
    };

    const result = concatenateStringValues(input);
    expect(result).toEqual(['hello', 'world', 'typescript']);
  });

  it('should return an empty array if no string values are present', () => {
    const input = {
      key1: 1,
      key2: true,
      key3: {},
      key4: []
    };

    const result = concatenateStringValues(input);
    expect(result).toEqual([]);
  });

  it('should handle an empty object', () => {
    const input = {};

    const result = concatenateStringValues(input);
    expect(result).toEqual([]);
  });

  it('should ignore non-string values and join the remaining strings with commas', () => {
    const input = {
      key1: 'test',
      key2: null,
      key3: 'jest',
      key4: 123
    };

    const result = concatenateStringValues(input);
    expect(result).toEqual(['test', 'jest']);
  });

  it('should join array of strings and concatenate with other string values', () => {
    const input = {
      key1: 'first',
      key2: ['apple', 'banana'],
      key3: 'second',
      key4: [1, 2, 'grape'],
      key5: ['carrot', 123]
    };

    const result = concatenateStringValues(input);
    expect(result).toEqual(['first', 'apple, banana', 'second', 'grape', 'carrot']);
  });

  it('should ignore arrays without strings', () => {
    const input = {
      key1: 'test',
      key2: [1, 2, 3],
      key3: 'example'
    };

    const result = concatenateStringValues(input);
    expect(result).toEqual(['test', 'example']);
  });
});

describe('isValidEmail', () => {
  it('should return true for a valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('should return false for an invalid email', () => {
    expect(isValidEmail('test@example')).toBe(false);
  });

  it('should return false for an empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('should return false for a string with no @', () => {
    expect(isValidEmail('testexample.com')).toBe(false);
  });

  it('should return false for a string with no .', () => {
    expect(isValidEmail('test@example')).toBe(false);
  });

  it('should return false for a string with a space', () => {
    expect(isValidEmail('test@ example.com')).toBe(false);
  });
});

describe('shortenHex', () => {
  it('should shorten valid wallet addresses', () => {
    const address = '0x35b058273Bd953189e29BE6fbBe57C0b66D79a04';
    const shortAddress = shortenHex(address);
    expect(shortAddress).toBe(shortenHex(address));
    expect(shortAddress.length).toBe(11);
  });
});
