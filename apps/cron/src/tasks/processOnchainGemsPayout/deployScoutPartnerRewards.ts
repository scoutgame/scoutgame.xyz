import type { ScoutPartner } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeason } from '@packages/dates/utils';
import { deployPartnerAirdropContract } from '@packages/scoutgame/partnerRewards/deployPartnerAirdropContract';
import { getBuilderEventsForPartnerRewards } from '@packages/scoutgame/partnerRewards/getBuilderEventsForPartnerReward';
import { getPartnerRewardAmount } from '@packages/scoutgame/scoutPartners/getPartnerRewardAmount';
import { type Address } from 'viem';

import { log } from './logger';

async function deployScoutPartnerReward({ week, scoutPartner }: { week: string; scoutPartner: ScoutPartner }) {
  const scoutPartnerId = scoutPartner.id;
  const scoutPartnerName = scoutPartner.name;
  const tokenAddress = scoutPartner.tokenAddress! as Address;
  const tokenDecimals = scoutPartner.tokenDecimals!;
  const tokenSymbol = scoutPartner.tokenSymbol!;
  const tokenChain = scoutPartner.tokenChain!;
  const builderEvents = await getBuilderEventsForPartnerRewards({ week, scoutPartnerId });
  const currentSeason = getCurrentSeason(week);

  const recipients = builderEvents
    .map((event) => {
      const address = event.githubUser.builder!.wallets[0]?.address;
      return {
        address: address ? address.toLowerCase() : null,
        prLink: event.url,
        tags: event.issues[0]?.tags ?? null
      };
    })
    .filter((recipient) => recipient.address) as {
    address: Address;
    prLink: string;
    tags: string[] | null;
  }[];

  log.info(`Found recipients for ${scoutPartnerId} rewards`, {
    recipients: recipients.length,
    recipientsMissingWallets: builderEvents.filter((event) => !event.githubUser.builder?.wallets[0]?.address).length
  });

  if (recipients.length === 0) {
    log.info(`No recipients found, skipping ${scoutPartnerName} rewards contract deployment`, {
      season: currentSeason.start,
      week
    });
    return;
  }

  const result = await deployPartnerAirdropContract({
    partner: scoutPartnerId,
    week,
    recipients: recipients.map((recipient) => ({
      address: recipient.address,
      amount: getPartnerRewardAmount({ scoutPartner, tags: recipient.tags }),
      meta: {
        prLink: recipient.prLink
      }
    })),
    tokenAddress,
    tokenSymbol,
    tokenDecimals,
    chainId: tokenChain,
    adminPrivateKey: process.env.REWARDS_WALLET_PRIVATE_KEY as Address
  });

  log.info(`${scoutPartnerName} rewards contract deployed`, {
    ...result,
    week,
    season: currentSeason.start
  });
}

export async function deployScoutPartnerRewards({ week }: { week: string }) {
  const scoutPartners = await prisma.scoutPartner.findMany({
    where: {
      status: 'active',
      tokenAddress: {
        not: null
      },
      tokenDecimals: {
        not: null
      },
      tokenSymbol: {
        not: null
      },
      tokenChain: {
        not: null
      }
    }
  });

  for (const scoutPartner of scoutPartners) {
    try {
      await deployScoutPartnerReward({
        week,
        scoutPartner
      });
    } catch (error) {
      log.error(`Error deploying ${scoutPartner.name} rewards contract`, {
        error,
        week,
        season: getCurrentSeason(week).start
      });
    }
  }
}
