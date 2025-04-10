import { prisma } from '@charmverse/core/prisma-client';
import { optimismTokenAddress, optimismTokenDecimals } from '@packages/blockchain/constants';
import { parseUnits } from 'viem';
import type { Address } from 'viem';

import { getMatchupDetails } from './getMatchupDetails';
import { getMatchupLeaderboard } from './getMatchupLeaderboard';

// Reward distribution percentages for top 3 positions
const REWARD_PERCENTAGES = {
  1: 0.5, // 50% for 1st place
  2: 0.3, // 30% for 2nd place
  3: 0.2 // 20% for 3rd place
} as const;

// OP token rewards for top 3 positions
const OP_REWARDS = {
  1: 60, // 60 OP for 1st place
  2: 25, // 25 OP for 2nd place
  3: 15 // 15 OP for 3rd place
} as const;

type MatchupRewardRecipient = { address: Address; scoutId: string; pointsAmount: number; opAmount: bigint };

export async function getMatchupRewards(week: string) {
  const leaderboard = await getMatchupLeaderboard(week);
  const matchupDetails = await getMatchupDetails(week);

  const matchupPool = matchupDetails.matchupPool;

  // Group entries by total gems collected to handle ties
  const groupedByGems = leaderboard.reduce<Record<number, typeof leaderboard>>((acc, entry) => {
    const gems = entry.totalGemsCollected;
    if (!acc[gems]) {
      acc[gems] = [];
    }
    acc[gems].push(entry);
    return acc;
  }, {});

  // Sort by gems collected (descending)
  const sortedGemsGroups = Object.keys(groupedByGems)
    .map(Number)
    .sort((a, b) => b - a);

  // Prepare recipients for the airdrop
  const recipients: MatchupRewardRecipient[] = [];

  // Track the current position and remaining rewards
  let currentPosition = 1;
  let remainingPool = matchupPool;

  // Process each group of entries with the same gems collected
  for (const gems of sortedGemsGroups) {
    const entries = groupedByGems[gems];

    // Skip if we've already processed the top 3 positions
    if (currentPosition > 3) break;

    // Calculate how many positions this group occupies
    const positionsInGroup = Math.min(entries.length, 4 - currentPosition);

    // Calculate the reward for this group
    let groupReward = 0;
    let groupOpReward = BigInt(0);

    // Sum up the rewards for all positions in this group
    for (let i = 0; i < positionsInGroup; i++) {
      const position = currentPosition + i;
      if (position <= 3) {
        groupReward += REWARD_PERCENTAGES[position as keyof typeof REWARD_PERCENTAGES] * matchupPool;
        groupOpReward += parseUnits(OP_REWARDS[position as keyof typeof OP_REWARDS].toString(), optimismTokenDecimals);
      }
    }

    // Split the reward equally among all entries in this group
    const rewardPerEntry = Math.floor(groupReward / entries.length);
    const opRewardPerEntry = groupOpReward / BigInt(entries.length);

    // Add each entry to the recipients list
    for (const entry of entries) {
      // Get the wallet address for the scout
      const scout = await prisma.scout.findUnique({
        where: { id: entry.scout.id },
        select: {
          wallets: {
            select: { address: true },
            where: {
              primary: true
            }
          }
        }
      });

      if (scout?.wallets[0]?.address) {
        recipients.push({
          address: scout.wallets[0].address as Address,
          scoutId: entry.scout.id,
          pointsAmount: rewardPerEntry,
          opAmount: opRewardPerEntry
        });

        // Update the remaining pool
        remainingPool -= rewardPerEntry;
      }
    }

    // Update the current position
    currentPosition += positionsInGroup;
  }

  return recipients;
}
