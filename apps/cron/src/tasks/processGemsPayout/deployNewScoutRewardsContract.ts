import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeason, getCurrentSeasonWeekNumber } from '@packages/dates/utils';
import { getRankedNewScoutsForPastWeek } from '@packages/scoutgame/scouts/getNewScouts';
import { parseUnits } from 'viem';
import { optimism } from 'viem/chains';

import { createSablierAirdropContract } from './createSablierAirdropContract';

const newScoutsRewards = [60, 50, 40, 35, 30, 25, 20, 15, 15, 10];

export const optimismTokenDecimals = 18;
export const optimismTokenAddress = '0x4200000000000000000000000000000000000042';

export async function deployNewScoutRewardsContract({ week }: { week: string }) {
  const newScouts = (await getRankedNewScoutsForPastWeek({ week })) as { address: string }[];

  const top10Scouts = newScouts.slice(0, 10);
  const currentSeason = getCurrentSeason(week);

  if (top10Scouts.length === 0) {
    log.info('No new scouts found, skipping new scout rewards contract deployment', {
      week,
      season: currentSeason.start
    });
    return;
  }

  const { hash, contractAddress, cid, merkleTree } = await createSablierAirdropContract({
    adminPrivateKey: process.env.NEW_SCOUT_REWARD_ADMIN_PRIVATE_KEY as `0x${string}`,
    campaignName: `Scoutgame New Scout ${currentSeason.title} Week ${getCurrentSeasonWeekNumber(week)} Rewards`,
    chainId: optimism.id,
    recipients: top10Scouts.map((scout, index) => ({
      address: scout.address.toLowerCase() as `0x${string}`,
      amount: newScoutsRewards[index]
    })),
    tokenAddress: optimismTokenAddress,
    tokenDecimals: optimismTokenDecimals,
    nullAddressAmount: 0.001
  });

  log.info('New scout rewards contract deployed', {
    hash,
    contractAddress,
    week,
    season: currentSeason.start
  });

  await prisma.partnerRewardPayoutContract.create({
    data: {
      chainId: optimism.id,
      contractAddress,
      season: currentSeason.start,
      week,
      tokenAddress: optimismTokenAddress,
      tokenSymbol: 'OP',
      tokenDecimals: optimismTokenDecimals,
      partner: 'optimism_new_scout',
      deployTxHash: hash,
      ipfsCid: cid,
      merkleTreeJson: merkleTree,
      rewardPayouts: {
        createMany: {
          data: top10Scouts.map((scout, index) => ({
            amount: parseUnits(newScoutsRewards[index].toString(), optimismTokenDecimals).toString(),
            walletAddress: scout.address.toLowerCase(),
            meta: {
              position: index + 1
            }
          }))
        }
      }
    }
  });

  return { hash, contractAddress };
}
