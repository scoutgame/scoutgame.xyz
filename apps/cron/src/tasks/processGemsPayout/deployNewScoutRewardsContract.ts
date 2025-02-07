import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonWeekNumber } from '@packages/dates/utils';
import { getRankedNewScoutsForPastWeek } from '@packages/scoutgame/scouts/getNewScouts';
import { parseUnits } from 'viem';
import { optimismSepolia } from 'viem/chains';

import { createSablierAirdropContract } from './createSablierAirdropContract';

const newScoutsRewards = [60, 50, 40, 35, 30, 25, 20, 15, 15, 10];

export const optimismTokenDecimals = 18;
// TODO: Testnet token address
export const optimismTokenAddress = '0x9b5490ba86677049d9bBAb47CAE2a360726CE258';

export async function deployNewScoutRewardsContract({ week, season }: { week: string; season: string }) {
  const newScouts = (await getRankedNewScoutsForPastWeek({ week })) as { address: string }[];

  const top10Scouts = newScouts.slice(0, 10);
  const { hash, contractAddress, cid, merkleTree } = await createSablierAirdropContract({
    adminPrivateKey: process.env.NEW_SCOUT_REWARD_ADMIN_PRIVATE_KEY as `0x${string}`,
    campaignName: `Scoutgame New Scout S${season}W${getCurrentSeasonWeekNumber(season)} Rewards`,
    chainId: optimismSepolia.id,
    recipients: top10Scouts.map((scout, index) => ({
      address: scout.address as `0x${string}`,
      amount: newScoutsRewards[index]
    })),
    tokenAddress: optimismTokenAddress,
    tokenDecimals: optimismTokenDecimals
  });

  log.info('New scout rewards contract deployed', {
    hash,
    contractAddress,
    week,
    season
  });

  await prisma.partnerRewardPayoutContract.create({
    data: {
      chainId: optimismSepolia.id,
      contractAddress,
      season,
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
            walletAddress: (scout.address as `0x${string}`).toLowerCase(),
            meta: {
              position: index + 1
            },
            // TODO: Delete the reward payout after its deployed
            deletedAt: new Date()
          }))
        }
      }
    }
  });

  return { hash, contractAddress };
}
