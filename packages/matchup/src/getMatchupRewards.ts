import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { optimismTokenDecimals } from '@packages/blockchain/constants';
import { getNextWeek } from '@packages/dates/utils';
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
type FreeMatchupRecipient = { address: Address; scoutId: string; week: string };

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
    orderBy: [{ totalScore: 'desc' }, { createdAt: 'asc' }],
    take: 5
  });
  const matchupDetails = await getMatchupDetails(week);

  // convert pool to wei
  const matchupPool = parseUnits(matchupDetails.matchupPool.toString(), devTokenDecimals);

  // Prepare recipients
  const recipients: MatchupRewardRecipient[] = [];
  const freeMatchupWinners: FreeMatchupRecipient[] = [];

  // Process each group of entries with the same gems collected
  for (const entry of leaderboard) {
    const position = leaderboard.indexOf(entry) + 1;

    // Calculate the reward for this group
    let rewardDevTokens = BigInt(0);
    let rewardOpTokens = BigInt(0);
    if (position <= 3) {
      rewardDevTokens +=
        (matchupPool * BigInt(REWARD_PERCENTAGES[position as keyof typeof REWARD_PERCENTAGES])) / BigInt(100);
      rewardOpTokens += parseUnits(OP_REWARDS[position as keyof typeof OP_REWARDS].toString(), optimismTokenDecimals);
      if (entry.scout.wallets[0]?.address) {
        recipients.push({
          address: entry.scout.wallets[0].address as Address,
          scoutId: entry.createdBy,
          devAmount: rewardDevTokens,
          opAmount: rewardOpTokens
        });
      }
    } else if (position === 4 || position === 5) {
      freeMatchupWinners.push({
        address: entry.scout.wallets[0].address as Address,
        scoutId: entry.createdBy,
        week: getNextWeek(week)
      });
    } else {
      log.warn('Unexpected: received too many recipients for matchup rewards', { size: leaderboard.length });
    }
  }

  return { tokenWinners: recipients, freeMatchupWinners };
}
