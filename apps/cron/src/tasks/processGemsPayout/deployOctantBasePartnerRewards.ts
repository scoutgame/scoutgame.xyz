import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeason, getCurrentSeasonWeekNumber } from '@packages/dates/utils';
import { getBuilderEventsForPartnerRewards } from '@packages/scoutgame/partnerReward/getBuilderEventsForPartnerReward';
import { parseUnits, type Address } from 'viem';
import { optimism } from 'viem/chains';

import { createSablierAirdropContract } from './createSablierAirdropContract';

const usdcTokenDecimals = 6;
const optimismUsdcTokenAddress = '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85';
const OCTANT_BASE_CONTRIBUTION_REWARD_AMOUNT = parseUnits('75', usdcTokenDecimals).toString();

export async function deployOctantBasePartnerRewards({ week }: { week: string }) {
  const builderEvents = await getBuilderEventsForPartnerRewards({ week, bonusPartner: 'octant' });
  const currentSeason = getCurrentSeason(week);
  const recipients = builderEvents.map((event) => ({
    address: event.githubUser.builder!.wallets[0].address,
    prLink: event.url
  })) as { address: Address; prLink: string }[];

  if (recipients.length === 0) {
    log.info('No recipients found, skipping octant & base rewards contact deployment', {
      season: currentSeason.start,
      week
    });
    return;
  }

  const { hash, contractAddress, cid, merkleTree } = await createSablierAirdropContract({
    adminPrivateKey: process.env.OCTANT_BASE_CONTRIBUTION_REWARD_AMOUNT as Address,
    campaignName: `Scoutgame Octant & Base ${currentSeason.title} Week ${getCurrentSeasonWeekNumber(week)} Rewards`,
    chainId: optimism.id,
    recipients: recipients.map((recipient) => ({
      address: recipient.address,
      amount: 75
    })),
    tokenAddress: optimismUsdcTokenAddress,
    tokenDecimals: usdcTokenDecimals,
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
      tokenDecimals: usdcTokenDecimals,
      partner: 'octant_base_contribution',
      deployTxHash: hash,
      ipfsCid: cid,
      merkleTreeJson: merkleTree,
      rewardPayouts: {
        createMany: {
          data: recipients.map((recipient) => ({
            amount: OCTANT_BASE_CONTRIBUTION_REWARD_AMOUNT,
            walletAddress: recipient.address.toLowerCase(),
            meta: {
              prLink: recipient.prLink
            }
          }))
        }
      }
    }
  });

  return { hash, contractAddress };
}
