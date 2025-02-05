import { prisma } from '@charmverse/core/prisma-client';
import { getRankedNewScoutsForPastWeek } from '@packages/scoutgame/scouts/getNewScouts';
import { optimism } from 'viem/chains';

import { createSablierAirdropContract } from '../../airdrop/createSablierAirdropContract';

const newScoutsRewards = [60, 50, 40, 35, 30, 25, 20, 15, 15, 10];

export async function createNewScoutRewardsContract({ week, season }: { week: string; season: string }) {
  const newScouts = await getRankedNewScoutsForPastWeek({ week });
  const top10Scouts = newScouts.slice(0, 10);
  const { hash, contractAddress } = await createSablierAirdropContract({
    adminPrivateKey: process.env.SABLIER_OP_AIRDROP_ADMIN_PRIVATE_KEY as `0x${string}`,
    campaignName: `New Scout Rewards Season: ${season}, Week: ${week}`,
    chainId: optimism.id,
    recipients: top10Scouts.map((scout, index) => ({
      address: scout.address as `0x${string}`,
      amount: newScoutsRewards[index]
    })),
    tokenAddress: '0x4200000000000000000000000000000000000042',
    tokenDecimals: optimism.nativeCurrency.decimals
  });

  await prisma.partnerRewardPayoutContract.create({
    data: {
      chainId: optimism.id,
      contractAddress,
      season,
      week,
      tokenAddress: '0x4200000000000000000000000000000000000042',
      partner: 'optimism:new_scout_rewards',
      deployTxHash: hash,
      rewardPayouts: {
        createMany: {
          data: top10Scouts.map((scout, index) => ({
            amount: newScoutsRewards[index],
            userId: scout.id as string
          }))
        }
      }
    }
  });

  return { hash, contractAddress };
}
