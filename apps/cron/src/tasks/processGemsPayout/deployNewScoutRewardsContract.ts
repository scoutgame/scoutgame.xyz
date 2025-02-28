import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeason, getCurrentSeasonWeekNumber } from '@packages/dates/utils';
import { getNewScoutRewards } from '@packages/scoutgame/scouts/getNewScoutRewards';
import { parseUnits } from 'viem';
import { optimism } from 'viem/chains';

import { createSablierAirdropContract } from './createSablierAirdropContract';

export const optimismTokenDecimals = 18;
export const optimismTokenAddress = '0x4200000000000000000000000000000000000042';

export async function deployNewScoutRewardsContract({ week }: { week: string }) {
  const top10Scouts = await getNewScoutRewards({ week });
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
      amount: scout.opAmount
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
            amount: parseUnits(scout.opAmount.toString(), optimismTokenDecimals).toString(),
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
