import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeason, getCurrentSeasonWeekNumber } from '@packages/dates/utils';
import { MATCHUP_OP_PRIZE } from '@packages/matchup/config';
import { getLeaderboard } from '@packages/matchup/getLeaderboard';
import { parseUnits, type Address } from 'viem';
import { optimism } from 'viem/chains';

import { createSablierAirdropContract } from './createSablierAirdropContract';

const optimismTokenDecimals = 18;
const optimismTokenAddress = '0x4200000000000000000000000000000000000042';

// Reward distribution percentages for top 3 positions
const REWARD_PERCENTAGES = {
  1: 0.5, // 50% for 1st place
  2: 0.3, // 30% for 2nd place
  3: 0.2 // 20% for 3rd place
};

// OP token rewards for top 3 positions
const OP_REWARDS = {
  1: 60, // 60 OP for 1st place
  2: 25, // 25 OP for 2nd place
  3: 15 // 15 OP for 3rd place
};

export async function deployMatchupRewardsContract({ week }: { week: string }) {
  const currentSeason = getCurrentSeason(week);

  // Get the leaderboard for the specified week
  const leaderboard = await getLeaderboard(week);

  if (leaderboard.length === 0) {
    log.info('No matchup entries found for the week, skipping matchup rewards contract deployment', {
      week,
      season: currentSeason.start
    });
    return;
  }

  // Get the matchup pool from the database
  const matchupCount = await prisma.scoutMatchup.count({
    where: {
      week,
      submittedAt: {
        not: null
      }
    }
  });

  // Calculate the total matchup pool (40 points per matchup)
  const matchupPool = matchupCount * 40;

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
  const recipients: { address: Address; opAmount: number }[] = [];

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
    let groupOpReward = 0;

    // Sum up the rewards for all positions in this group
    for (let i = 0; i < positionsInGroup; i++) {
      const position = currentPosition + i;
      if (position <= 3) {
        groupReward += REWARD_PERCENTAGES[position as keyof typeof REWARD_PERCENTAGES] * matchupPool;
        groupOpReward += OP_REWARDS[position as keyof typeof OP_REWARDS];
      }
    }

    // Split the reward equally among all entries in this group
    const rewardPerEntry = groupReward / entries.length;
    const opRewardPerEntry = groupOpReward / entries.length;

    // Add each entry to the recipients list
    for (const entry of entries) {
      // Get the wallet address for the scout
      const scout = await prisma.scout.findUnique({
        where: { id: entry.scout.id },
        select: { wallets: { select: { address: true } } }
      });

      if (scout?.wallets[0]?.address) {
        recipients.push({
          address: scout.wallets[0].address.toLowerCase() as Address,
          opAmount: opRewardPerEntry
        });

        // Update the remaining pool
        remainingPool -= rewardPerEntry;
      }
    }

    // Update the current position
    currentPosition += positionsInGroup;
  }

  if (recipients.length === 0) {
    log.info('No valid recipients found for matchup rewards, skipping contract deployment', {
      week,
      season: currentSeason.start
    });
    return;
  }

  // Deploy the Sablier airdrop contract
  const { hash, contractAddress, cid, merkleTree } = await createSablierAirdropContract({
    adminPrivateKey: process.env.MATCHUP_REWARDS_ADMIN_PRIVATE_KEY as `0x${string}`,
    campaignName: `Scoutgame Matchup ${currentSeason.title} Week ${getCurrentSeasonWeekNumber(week)} Rewards`,
    chainId: optimism.id,
    tokenAddress: optimismTokenAddress,
    tokenDecimals: optimismTokenDecimals,
    recipients: recipients.map(({ address, opAmount }) => ({ address, amount: opAmount })),
    nullAddressAmount: 0.001
  });

  log.info('Matchup rewards contract deployed', {
    hash,
    contractAddress,
    week,
    season: currentSeason.start,
    recipientsCount: recipients.length
  });

  // Record the payout in the database
  await prisma.partnerRewardPayoutContract.create({
    data: {
      chainId: optimism.id,
      contractAddress,
      season: currentSeason.start,
      week,
      ipfsCid: cid,
      merkleTreeJson: merkleTree,
      tokenAddress: optimismTokenAddress,
      tokenDecimals: optimismTokenDecimals,
      tokenSymbol: 'OP',
      partner: 'matchup_rewards',
      deployTxHash: hash,
      rewardPayouts: {
        createMany: {
          data: recipients.map(({ address, opAmount }) => ({
            amount: parseUnits(opAmount.toString(), optimismTokenDecimals).toString(),
            walletAddress: address,
            meta: {
              week,
              matchupPool,
              position: 'top_3'
            }
          }))
        }
      }
    }
  });

  return {
    hash,
    contractAddress
  };
}
