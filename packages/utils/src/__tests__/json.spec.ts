import { toJson } from '../json';

describe('toJson', () => {
  it('should correctly serialize and deserialize bigint values', () => {
    const data = {
      bigIntValue: BigInt(9007199254740991),
      normalValue: 123
    };
    const serialized = toJson(data);
    const deserialized = JSON.parse(serialized!);
    expect(deserialized).toEqual({
      bigIntValue: 9007199254740991,
      normalValue: 123
    });
  });

  it('should handle undefined input', () => {
    const result = toJson(undefined);
    expect(result).toBeUndefined();
  });
});
