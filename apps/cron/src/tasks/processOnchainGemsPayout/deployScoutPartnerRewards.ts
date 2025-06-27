import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeason } from '@packages/dates/utils';
import { deployPartnerAirdropContract } from '@packages/scoutgame/partnerRewards/deployPartnerAirdropContract';
import { getBuilderEventsForPartnerRewards } from '@packages/scoutgame/partnerRewards/getBuilderEventsForPartnerReward';
import { parseUnits, type Address } from 'viem';

import { log } from './logger';

type MinimalScoutPartner = {
  partnerId: string;
  partnerName: string;
  tokenAddress: `0x${string}`;
  tokenDecimals: number;
  tokenSymbol: string;
  tokenChain: number;
  issueTagTokenAmounts: { tag: string; amount: number }[];
  tokenAmountPerPullRequest: number;
};

export function getPartnerRewardAmount({
  scoutPartner,
  tags
}: {
  tags: string[] | null;
  scoutPartner: MinimalScoutPartner;
}): bigint {
  if (!scoutPartner.tokenDecimals) {
    throw new Error('Scout partner token decimals is not set');
  }

  const issueTagTokenAmounts = scoutPartner.issueTagTokenAmounts as { tag: string; amount: number }[];
  if (issueTagTokenAmounts.length === 0 && scoutPartner.tokenAmountPerPullRequest) {
    return parseUnits(scoutPartner.tokenAmountPerPullRequest.toString(), scoutPartner.tokenDecimals);
  }

  if (!tags) {
    const defaultTag = issueTagTokenAmounts[0];
    return parseUnits(defaultTag.amount.toString(), scoutPartner.tokenDecimals);
  }

  let rewardAmount = parseUnits('0', scoutPartner.tokenDecimals);
  const matchingTagTokenAmount = issueTagTokenAmounts.find((issueTagTokenAmount) =>
    tags?.includes(issueTagTokenAmount.tag)
  );
  if (matchingTagTokenAmount) {
    rewardAmount = parseUnits(matchingTagTokenAmount.amount.toString(), scoutPartner.tokenDecimals);
  }
  return rewardAmount;
}

async function deployScoutPartnerReward({ week, scoutPartner }: { week: string; scoutPartner: MinimalScoutPartner }) {
  const scoutPartnerId = scoutPartner.partnerId;
  const scoutPartnerName = scoutPartner.partnerName;
  const tokenAddress = scoutPartner.tokenAddress;
  const tokenDecimals = scoutPartner.tokenDecimals;
  const tokenSymbol = scoutPartner.tokenSymbol;
  const tokenChain = scoutPartner.tokenChain;
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
    },
    select: {
      id: true,
      name: true,
      tokenAddress: true,
      tokenDecimals: true,
      tokenSymbol: true,
      tokenChain: true,
      issueTagTokenAmounts: true,
      tokenAmountPerPullRequest: true
    }
  });

  for (const scoutPartner of scoutPartners) {
    try {
      await deployScoutPartnerReward({
        week,
        scoutPartner: {
          partnerId: scoutPartner.id,
          partnerName: scoutPartner.name,
          tokenAddress: scoutPartner.tokenAddress as Address,
          tokenDecimals: scoutPartner.tokenDecimals!,
          tokenSymbol: scoutPartner.tokenSymbol!,
          tokenChain: scoutPartner.tokenChain! as number,
          tokenAmountPerPullRequest: scoutPartner.tokenAmountPerPullRequest!,
          issueTagTokenAmounts: scoutPartner.issueTagTokenAmounts as { tag: string; amount: number }[]
        }
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
