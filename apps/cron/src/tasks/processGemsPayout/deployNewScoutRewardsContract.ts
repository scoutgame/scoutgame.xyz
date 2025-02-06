import { prisma } from '@charmverse/core/prisma-client';
import { getRankedNewScoutsForPastWeek } from '@packages/scoutgame/scouts/getNewScouts';
import { parseUnits } from 'viem';
import { optimism } from 'viem/chains';

import { createSablierAirdropContract } from './createSablierAirdropContract';

const newScoutsRewards = [60, 50, 40, 35, 30, 25, 20, 15, 15, 10];

export const optimismTokenDecimals = 18;
export const optimismTokenAddress = '0x4200000000000000000000000000000000000042';

export async function deployNewScoutRewardsContract({ week, season }: { week: string; season: string }) {
  const newScouts = await getRankedNewScoutsForPastWeek({ week });
  const top10Scouts = newScouts.slice(0, 10);
  const { hash, contractAddress, cid, root } = await createSablierAirdropContract({
    adminPrivateKey: process.env.OP_AIRDROP_ADMIN_PRIVATE_KEY as `0x${string}`,
    campaignName: `New Scout Rewards Season: ${season}, Week: ${week}`,
    chainId: optimism.id,
    recipients: top10Scouts.map((scout, index) => ({
      address: scout.address as `0x${string}`,
      amount: newScoutsRewards[index]
    })),
    tokenAddress: optimismTokenAddress,
    tokenDecimals: optimismTokenDecimals
  });

  await prisma.partnerRewardPayoutContract.create({
    data: {
      chainId: optimism.id,
      contractAddress,
      season,
      week,
      tokenAddress: optimismTokenAddress,
      partner: 'optimism_new_scout',
      deployTxHash: hash,
      tokenDecimals: optimismTokenDecimals,
      cid,
      rewardPayouts: {
        createMany: {
          data: top10Scouts.map((scout, index) => ({
            amount: parseUnits(newScoutsRewards[index].toString(), optimismTokenDecimals),
            userId: scout.id as string,
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
