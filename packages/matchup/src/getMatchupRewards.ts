import { prisma } from '@charmverse/core/prisma-client';
import { optimismTokenDecimals } from '@packages/blockchain/constants';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { parseUnits } from 'viem';
import type { Address } from 'viem';

import { getMatchupDetails } from './getMatchupDetails';

// Reward distribution percentages for top 3 positions
const REWARD_PERCENTAGES = {
  1: BigInt(50), // 50% for 1st place
  2: BigInt(30), // 30% for 2nd place
  3: BigInt(20) // 20% for 3rd place
} as const;

// OP token rewards for top 3 positions
const OP_REWARDS = {
  1: 60, // 60 OP for 1st place
  2: 25, // 25 OP for 2nd place
  3: 15 // 15 OP for 3rd place
} as const;

type MatchupRewardRecipient = { address: Address; scoutId: string; devAmount: bigint; opAmount: bigint };

export async function getMatchupRewards(week: string) {
  const leaderboard = await prisma.scoutMatchup.findMany({
    where: {
      week,
      totalScore: {
        gt: 0
      },
      OR: [
        {
          registrationTx: { status: 'success' }
        },
        {
          freeRegistration: true
        }
      ]
    },
    select: {
      totalScore: true,
      createdBy: true,
      scout: {
        select: {
          wallets: {
            select: {
              address: true
            },
            where: {
              primary: true
            }
          }
        }
      }
    },
    orderBy: {
      totalScore: 'desc'
    }
  });
  const matchupDetails = await getMatchupDetails(week);

  // convert to wei
  const matchupPool = parseUnits(matchupDetails.matchupPool.toString(), devTokenDecimals);

  // Group entries by total gems collected to handle ties
  const groupedByScore = leaderboard.reduce<Record<number, typeof leaderboard>>((acc, entry) => {
    const gems = entry.totalScore;
    if (!acc[gems]) {
      acc[gems] = [];
    }
    acc[gems].push(entry);
    return acc;
  }, {});

  // Sort by gems collected (descending)
  const sortedScoreGroups = Object.keys(groupedByScore)
    .map(Number)
    .sort((a, b) => b - a);

  // Prepare recipients for the airdrop
  const recipients: MatchupRewardRecipient[] = [];

  // Track the current position and remaining rewards
  let currentPosition = 1;

  // Process each group of entries with the same gems collected
  for (const score of sortedScoreGroups) {
    const entries = groupedByScore[score];

    // Skip if we've already processed the top 3 positions
    if (currentPosition > 3) break;

    // Calculate how many positions this group occupies
    const positionsInGroup = Math.min(entries.length, 4 - currentPosition);

    // Calculate the reward for this group
    let groupDevReward = BigInt(0);
    let groupOpReward = BigInt(0);

    // Sum up the rewards for all positions in this group
    for (let i = 0; i < positionsInGroup; i++) {
      const position = currentPosition + i;
      if (position <= 3) {
        groupDevReward +=
          (matchupPool * BigInt(REWARD_PERCENTAGES[position as keyof typeof REWARD_PERCENTAGES])) / BigInt(100);
        groupOpReward += parseUnits(OP_REWARDS[position as keyof typeof OP_REWARDS].toString(), optimismTokenDecimals);
      }
    }

    // Split the reward equally among all entries in this group
    const rewardPerEntry = groupDevReward / BigInt(entries.length);
    const opRewardPerEntry = groupOpReward / BigInt(entries.length);

    // Add each entry to the recipients list
    for (const entry of entries) {
      if (entry.scout.wallets[0]?.address) {
        recipients.push({
          address: entry.scout.wallets[0].address as Address,
          scoutId: entry.createdBy,
          devAmount: rewardPerEntry,
          opAmount: opRewardPerEntry
        });
      }
    }

    // Update the current position
    currentPosition += positionsInGroup;
  }

  // 4th and 5th place winners get a free matchup. just take the next 2 entries
  const freeMatchupWinners = leaderboard.slice(recipients.length, recipients.length + 2);

  return { tokenWinners: recipients, freeMatchupWinners };
}
