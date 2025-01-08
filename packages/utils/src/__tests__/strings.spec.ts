import { concatenateStringValues } from '../strings';
import { uuidFromNumber } from '../uuid';

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

describe('uuidFromNumber', () => {
  it('should generate a deterministic UUID v4 based on an integer input', () => {
    const input = 1234567890;
    const result = uuidFromNumber(input);
    const firstUuid = 'c775e7b7-57ed-4630-8d0a-a1113bd10266';
    expect(result).toEqual(firstUuid);

    const result2 = uuidFromNumber(input);
    expect(result2).toEqual(firstUuid);

    const otherInput = 1234567891;
    const result3 = uuidFromNumber(otherInput);
    const secondUuid = '523aa18e-cb89-4c51-bbdb-e28c57e10a92';
    expect(result3).toEqual(secondUuid);

    const result4 = uuidFromNumber(otherInput);
    expect(result4).toEqual(secondUuid);
  });
});
