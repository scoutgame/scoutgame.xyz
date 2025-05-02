import { calculateEarnableTokensForRank } from '../calculateTokens';

describe('calculateEarnableTokensForRank', () => {
  it('should return correct value for rank 1', () => {
    expect(calculateEarnableTokensForRank({ rank: 1, weeklyAllocatedTokens: BigInt(100) })).toEqual(BigInt(3));
  });

  it('should return correct value for rank 100', () => {
    expect(calculateEarnableTokensForRank({ rank: 100, weeklyAllocatedTokens: BigInt(100_000) })).toEqual(BigInt(147));
  });
});
