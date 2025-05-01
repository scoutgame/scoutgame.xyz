const decayRate = 0.03;

export function calculateEarnableScoutPointsForRank({
  rank,
  weeklyAllocatedTokens
}: {
  rank: number;
  weeklyAllocatedTokens: number;
}) {
  return weeklyAllocatedTokens * ((1 - decayRate) ** (rank - 1) - (1 - decayRate) ** rank);
}
