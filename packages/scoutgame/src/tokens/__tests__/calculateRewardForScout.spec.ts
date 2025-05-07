import { calculateRewardForScout } from '../divideTokensBetweenDeveloperAndHolders';

describe('calculateRewardForScout', () => {
  it('should calculate rewards with default pool values', () => {
    const result = calculateRewardForScout({
      purchased: { default: 1, starterPack: 1 },
      supply: { default: 10, starterPack: 10 },
      scoutsRewardPool: 1
    });

    // Default NFT: 1/10 * 0.7 = 0.07
    // Starter Pack: 1/10 * 0.1 = 0.01
    expect(result.toFixed(2)).toBe('0.08');
  });

  it('should calculate rewards with custom pool values', () => {
    const result = calculateRewardForScout({
      builderPool: 30,
      starterPackPool: 20,
      defaultPool: 50,
      purchased: { default: 2, starterPack: 2 },
      supply: { default: 10, starterPack: 10 },
      scoutsRewardPool: 1
    });

    // Default NFT: 2/10 * 0.5 = 0.1
    // Starter Pack: 2/10 * 0.2 = 0.04
    expect(result.toFixed(2)).toBe('0.14');
  });

  it('should handle zero purchases', () => {
    const result = calculateRewardForScout({
      purchased: { default: 0, starterPack: 0 },
      supply: { default: 10, starterPack: 10 },
      scoutsRewardPool: 1
    });

    expect(result).toBe(0);
  });

  it('should handle missing purchase types', () => {
    const result = calculateRewardForScout({
      purchased: { default: 1 },
      supply: { default: 10, starterPack: 10 },
      scoutsRewardPool: 1
    });

    // Only default NFT: 1/10 * 0.7 = 0.07
    // No starter pack purchases = 0
    expect(result.toFixed(2)).toBe('0.07');
  });

  it('should handle zero supply', () => {
    const result = calculateRewardForScout({
      purchased: { default: 0, starterPack: 0 },
      supply: { default: 0, starterPack: 0 },
      scoutsRewardPool: 1
    });

    expect(result).toBe(0);
  });

  it('should handle purchases exceeding supply', () => {
    expect(() =>
      calculateRewardForScout({
        purchased: { default: 15, starterPack: 15 },
        supply: { default: 10, starterPack: 10 },
        scoutsRewardPool: 1
      })
    ).toThrow();
  });

  it('should throw an error if builder and starter pack pool are too big', () => {
    expect(() =>
      calculateRewardForScout({
        builderPool: 0.5,
        starterPackPool: 0.5,
        purchased: { default: 1, starterPack: 1 },
        supply: { default: 1, starterPack: 1 },
        scoutsRewardPool: 1
      })
    ).toThrow();
  });
});
