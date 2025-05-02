import { parseUnits } from 'viem';

import { calculateRewardForScout } from '../divideTokensBetweenDeveloperAndHolders';

describe('calculateRewardForScout', () => {
  it('should calculate rewards with default pool values', () => {
    const result = calculateRewardForScout({
      purchased: { default: 1, starterPack: 1 },
      supply: { default: 10, starterPack: 10 },
      scoutsRewardPool: BigInt(100)
    });

    // Default NFT: 1/10 * 0.7 = 0.07
    // Starter Pack: 1/10 * 0.1 = 0.01
    expect(result).toEqual(BigInt(8));
  });

  it('should calculate rewards with custom pool values', () => {
    const result = calculateRewardForScout({
      developerPool: parseUnits('30', 18),
      starterPackPool: parseUnits('20', 18),
      defaultPool: parseUnits('50', 18),
      purchased: { default: 2, starterPack: 2 },
      supply: { default: 10, starterPack: 10 },
      scoutsRewardPool: parseUnits('100', 18)
    });

    // Default NFT: 2/10 * 0.5 = 0.1
    // Starter Pack: 2/10 * 0.2 = 0.04
    expect(result).toEqual(parseUnits('14', 18));
  });

  it('should handle zero purchases', () => {
    const result = calculateRewardForScout({
      purchased: { default: 0, starterPack: 0 },
      supply: { default: 10, starterPack: 10 },
      scoutsRewardPool: BigInt(100)
    });

    expect(result).toEqual(BigInt(0));
  });

  it('should handle missing purchase types', () => {
    const result = calculateRewardForScout({
      purchased: { default: 1 },
      supply: { default: 10, starterPack: 10 },
      scoutsRewardPool: BigInt(100)
    });

    // Only default NFT: 1/10 * 0.7 = 0.07
    // No starter pack purchases = 0
    expect(result).toEqual(BigInt(7));
  });

  it('should handle zero supply', () => {
    const result = calculateRewardForScout({
      purchased: { default: 0, starterPack: 0 },
      supply: { default: 0, starterPack: 0 },
      scoutsRewardPool: BigInt(100)
    });

    expect(result).toEqual(BigInt(0));
  });

  it('should handle purchases exceeding supply', () => {
    expect(() =>
      calculateRewardForScout({
        purchased: { default: 15, starterPack: 15 },
        supply: { default: 10, starterPack: 10 },
        scoutsRewardPool: BigInt(100)
      })
    ).toThrow();
  });

  it('should throw an error if builder and starter pack pool are too big', () => {
    expect(() =>
      calculateRewardForScout({
        developerPool: BigInt(50),
        starterPackPool: BigInt(50),
        purchased: { default: 1, starterPack: 1 },
        supply: { default: 1, starterPack: 1 },
        scoutsRewardPool: BigInt(100)
      })
    ).toThrow();
  });
});
