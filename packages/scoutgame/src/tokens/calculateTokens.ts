const decayRate = 0.03;

export function calculateEarnableTokensForRank({
  rank,
  weeklyAllocatedTokens
}: {
  rank: number;
  weeklyAllocatedTokens: bigint;
}) {
  // This equation calculates the tokens earned for a specific rank using a geometric decay model:
  // 1. (1 - decayRate) ** (rank - 1) represents the proportion of tokens remaining after decay for the previous rank
  // 2. (1 - decayRate) ** rank represents the proportion of tokens remaining after decay for the current rank
  // 3. The difference between these two values gives us the proportion of tokens allocated to the current rank
  // 4. This proportion is then multiplied by the total weekly allocated tokens to get the actual token amount
  //
  // As rank increases, the amount of tokens earned decreases exponentially based on the decay rate
  const coefficient = (1 - decayRate) ** (rank - 1) - (1 - decayRate) ** rank;
  const scale = 1000000; // up to 6 decimal places
  const coefficientBigInt = BigInt(Math.floor(coefficient * scale));
  return (weeklyAllocatedTokens * coefficientBigInt) / BigInt(scale);
}
