import { uuidFromNumber } from '../uuid';

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
