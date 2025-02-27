import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeason, getCurrentSeasonWeekNumber } from '@packages/dates/utils';
import { sendEmailTemplate } from '@packages/mailer/sendEmailTemplate';
import { getBuilderEventsForPartnerRewards } from '@packages/scoutgame/partnerReward/getBuilderEventsForPartnerReward';
import { parseUnits, type Address } from 'viem';
import { base } from 'viem/chains';

import { createSablierAirdropContract } from './createSablierAirdropContract';

const usdcTokenDecimals = 6;
const baseUsdcTokenAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const OCTANT_BASE_CONTRIBUTION_REWARD_AMOUNT = parseUnits('75', usdcTokenDecimals).toString();

export async function deployOctantBasePartnerRewards({ week }: { week: string }) {
  const builderEvents = await getBuilderEventsForPartnerRewards({ week, bonusPartner: 'octant' });
  const currentSeason = getCurrentSeason(week);
  const recipients = builderEvents
    .map((event) => {
      const address = event.githubUser.builder!.wallets[0]?.address;
      return {
        address: address ? address.toLowerCase() : null,
        prLink: event.url
      };
    })
    .filter((recipient) => recipient.address) as { address: Address; prLink: string }[];

  if (recipients.length === 0) {
    log.info('No recipients found, skipping octant & base rewards contract deployment', {
      season: currentSeason.start,
      week
    });
    return;
  }

  const { hash, contractAddress, cid, merkleTree, normalizedRecipients } = await createSablierAirdropContract({
    adminPrivateKey: process.env.OCTANT_BASE_CONTRIBUTION_REWARD_ADMIN_PRIVATE_KEY as Address,
    campaignName: `Scoutgame Octant & Base contribution ${currentSeason.title} Week ${getCurrentSeasonWeekNumber(week)} Rewards`,
    chainId: base.id,
    recipients: recipients.map((recipient) => ({
      address: recipient.address,
      amount: 75
    })),
    tokenAddress: baseUsdcTokenAddress,
    tokenDecimals: usdcTokenDecimals,
    nullAddressAmount: 0.001
  });

  log.info('Octant & Base contribution rewards contract deployed', {
    hash,
    contractAddress,
    week,
    season: currentSeason.start
  });

  await prisma.partnerRewardPayoutContract.create({
    data: {
      chainId: base.id,
      contractAddress,
      season: currentSeason.start,
      week,
      tokenAddress: baseUsdcTokenAddress,
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
            walletAddress: recipient.address,
            meta: {
              prLink: recipient.prLink
            }
          }))
        }
      }
    }
  });

  for (const recipient of normalizedRecipients) {
    try {
      const builder = await prisma.scout.findFirstOrThrow({
        where: {
          wallets: {
            some: { address: recipient.address.toLowerCase() }
          }
        },
        select: {
          displayName: true,
          id: true
        }
      });
      await sendEmailTemplate({
        userId: builder.id,
        templateType: 'partner_reward_payout',
        subject: 'You have received partner rewards! 🎉',
        templateVariables: {
          builder_name: builder.displayName,
          partner: 'Octant & Base Contribution',
          amount: OCTANT_BASE_CONTRIBUTION_REWARD_AMOUNT,
          token: 'USDC'
        },
        senderAddress: 'The Scout Game <updates@mail.scoutgame.xyz>'
      });
    } catch (error) {
      log.error('Error sending partner reward payout email', { error, userId: recipient.address });
    }
  }

  return { hash, contractAddress };
}
