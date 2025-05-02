import { calculateEarnableTokensForRank } from '../calculateTokens';

describe('calculateEarnableTokensForRank', () => {
  it('should return correct value for rank 1', () => {
    expect(calculateEarnableTokensForRank({ rank: 1, weeklyAllocatedTokens: 100 })).toBeCloseTo(3);
  });

  it('should return correct value for rank 100', () => {
    expect(calculateEarnableTokensForRank({ rank: 100, weeklyAllocatedTokens: 100 })).toBeCloseTo(0.147);
  });
});
