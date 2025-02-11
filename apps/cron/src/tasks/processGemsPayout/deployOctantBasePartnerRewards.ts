import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeason, getCurrentSeasonWeekNumber } from '@packages/dates/utils';
import { getBuilderEventsForPartnerRewards } from '@packages/scoutgame/partnerReward/getBuilderEventsForPartnerReward';
import type { Address } from 'viem';
import { optimism } from 'viem/chains';

import { createSablierAirdropContract } from './createSablierAirdropContract';

export const optimismTokenDecimals = 18;
export const optimismUsdcTokenAddress = '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85';

export async function deployOctantBasePartnerRewards({ week }: { week: string }) {
  const builderEvents = await getBuilderEventsForPartnerRewards({ week, bonusPartner: 'octant' });
  const currentSeason = getCurrentSeason(week);
  const addresses = builderEvents.map((event) => event.githubUser.builder!.wallets[0].address) as Address[];

  const { hash, contractAddress, cid, merkleTree } = await createSablierAirdropContract({
    adminPrivateKey: process.env.OCTANT_BASE_REWARD_ADMIN_PRIVATE_KEY as Address,
    campaignName: `Scoutgame Octant & Base ${currentSeason.title} Week ${getCurrentSeasonWeekNumber(week)} Rewards`,
    chainId: optimism.id,
    recipients: addresses.map((address) => ({
      address,
      amount: 75
    })),
    tokenAddress: optimismUsdcTokenAddress,
    tokenDecimals: optimismTokenDecimals,
    nullAddressAmount: 0.001
  });

  log.info('Octant & Base rewards contract deployed', {
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
      tokenAddress: optimismUsdcTokenAddress,
      tokenSymbol: 'USDC',
      tokenDecimals: optimismTokenDecimals,
      partner: 'octant_base',
      deployTxHash: hash,
      ipfsCid: cid,
      merkleTreeJson: merkleTree,
      rewardPayouts: {
        createMany: {
          data: merkleTree.recipients.map((recipient) => ({
            amount: recipient.amount,
            walletAddress: recipient.address.toLowerCase()
          }))
        }
      }
    }
  });

  return { hash, contractAddress };
}
