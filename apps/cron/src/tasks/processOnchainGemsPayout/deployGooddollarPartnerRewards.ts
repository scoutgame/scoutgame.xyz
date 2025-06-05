import { GOODDOLLAR_TOKEN_ADDRESS } from '@packages/blockchain/constants';
import { getCurrentSeason, getLastWeek } from '@packages/dates/utils';
import { deployPartnerAirdropContract } from '@packages/scoutgame/partnerRewards/deployPartnerAirdropContract';
import { getBuilderEventsForPartnerRewards } from '@packages/scoutgame/partnerRewards/getBuilderEventsForPartnerReward';
import { parseUnits, type Address } from 'viem';
import { celo } from 'viem/chains';

import { log } from './logger';

const gooddollarTokenDecimals = 18;

const goodDollarGithubTagsRewardRecord = {
  'Scouts Game - Common': parseUnits('500000', gooddollarTokenDecimals),
  'Scouts Game - Rare': parseUnits('1500000', gooddollarTokenDecimals),
  'Scouts Game - Epic': parseUnits('2500000', gooddollarTokenDecimals),
  'Scouts Game - Mythic': parseUnits('3500000', gooddollarTokenDecimals),
  'Scouts Game - Legendary': parseUnits('4500000', gooddollarTokenDecimals)
};

const goodDollarGithubTags = Object.keys(
  goodDollarGithubTagsRewardRecord
) as (keyof typeof goodDollarGithubTagsRewardRecord)[];

const defaultGithubTag = 'Scouts Game - Common' as keyof typeof goodDollarGithubTagsRewardRecord;

export async function deployGooddollarPartnerRewards({ week }: { week: string }) {
  const builderEvents = await getBuilderEventsForPartnerRewards({ week, bonusPartner: 'gooddollar' });
  const currentSeason = getCurrentSeason(week);
  const recipients = builderEvents
    .map((event) => {
      const address = event.githubUser.builder!.wallets[0]?.address;
      const githubTags = event.issues[0]?.tags ?? [];
      return {
        address: address ? address.toLowerCase() : null,
        prLink: event.url,
        // Find first matching tag from the list of tags
        githubTag: goodDollarGithubTags.find((tag) => githubTags.includes(tag)) ?? null
      };
    })
    .filter((recipient) => recipient.address) as {
    address: Address;
    prLink: string;
    githubTag: keyof typeof goodDollarGithubTagsRewardRecord | null;
  }[];

  log.info('Found recipients for gooddollar rewards', {
    recipients: recipients.length,
    recipientsMissingWallets: builderEvents.filter((event) => !event.githubUser.builder?.wallets[0]?.address).length
  });

  if (recipients.length === 0) {
    log.info('No recipients found, skipping gooddollar rewards contract deployment', {
      season: currentSeason.start,
      week
    });
    return;
  }
  const result = await deployPartnerAirdropContract({
    partner: 'gooddollar_contribution',
    week,
    recipients: recipients.map((recipient) => ({
      address: recipient.address,
      amount: goodDollarGithubTagsRewardRecord[recipient.githubTag ?? defaultGithubTag],
      meta: {
        prLink: recipient.prLink
      }
    })),
    tokenAddress: GOODDOLLAR_TOKEN_ADDRESS,
    tokenSymbol: 'G$',
    tokenDecimals: gooddollarTokenDecimals,
    chainId: celo.id,
    adminPrivateKey: process.env.REWARDS_WALLET_PRIVATE_KEY as Address
  });

  log.info('Gooddollar contribution rewards contract deployed', {
    ...result,
    week,
    season: currentSeason.start
  });
}
