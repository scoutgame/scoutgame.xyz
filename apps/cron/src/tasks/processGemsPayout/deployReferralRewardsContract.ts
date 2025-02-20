import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeason, getCurrentSeasonWeekNumber } from '@packages/dates/utils';
import { getReferralsToReward } from '@packages/scoutgame/quests/getReferralsToReward';
import type { DateTime } from 'luxon';
import { parseUnits } from 'viem';
import { optimism } from 'viem/chains';

import { createSablierAirdropContract } from './createSablierAirdropContract';
import { optimismTokenDecimals, optimismTokenAddress } from './deployNewScoutRewardsContract';

export async function deployReferralChampionRewardsContract({ week }: { week: string }) {
  const currentSeason = getCurrentSeason(week);

  const recipients = await getReferralsToReward({ week });

  if (recipients.length === 0) {
    log.info('No referral reward recipients found for the week, skipping referral rewards contract deployment', {
      week,
      season: currentSeason.start
    });
    return;
  }

  const { hash, contractAddress, cid, merkleTree } = await createSablierAirdropContract({
    adminPrivateKey: process.env.REFERRAL_CHAMPION_REWARD_ADMIN_PRIVATE_KEY as `0x${string}`,
    campaignName: `Scoutgame Referral Champion ${currentSeason.title} Week ${getCurrentSeasonWeekNumber(week)} Rewards`,
    chainId: optimism.id,
    tokenAddress: optimismTokenAddress,
    tokenDecimals: optimismTokenDecimals,
    recipients: recipients.map(({ address, opAmount }) => ({ address: address as `0x${string}`, amount: opAmount })),
    nullAddressAmount: 0.001
  });

  log.info('Referral champion rewards contract deployed', {
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
      ipfsCid: cid,
      merkleTreeJson: merkleTree,
      tokenAddress: optimismTokenAddress,
      tokenDecimals: optimismTokenDecimals,
      tokenSymbol: 'OP',
      partner: 'optimism_referral_champion',
      deployTxHash: hash,
      rewardPayouts: {
        createMany: {
          data: recipients.map(({ address, opAmount }) => ({
            amount: parseUnits(opAmount.toString(), optimismTokenDecimals).toString(),
            walletAddress: address,
            meta: {
              week
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
