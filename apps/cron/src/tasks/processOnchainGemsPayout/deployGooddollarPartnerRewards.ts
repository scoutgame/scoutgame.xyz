import { GOODDOLLAR_TOKEN_ADDRESS } from '@packages/blockchain/constants';
import { getCurrentSeason } from '@packages/dates/utils';
import { deployPartnerAirdropContract } from '@packages/scoutgame/partnerRewards/deployPartnerAirdropContract';
import { getBuilderEventsForPartnerRewards } from '@packages/scoutgame/partnerRewards/getBuilderEventsForPartnerReward';
import { getGooddollarPartnerRewardAmount } from '@packages/scoutgame/partnerRewards/getGooddollarPartnerRewardAmount';
import { type Address } from 'viem';
import { celo } from 'viem/chains';

import { log } from './logger';

export async function deployGooddollarPartnerRewards({ week }: { week: string }) {
  const builderEvents = await getBuilderEventsForPartnerRewards({ week, scoutPartnerId: 'gooddollar' });
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
    partner: 'gooddollar',
    week,
    recipients: recipients.map((recipient) => ({
      address: recipient.address,
      amount: getGooddollarPartnerRewardAmount(recipient.tags),
      meta: {
        prLink: recipient.prLink
      }
    })),
    tokenAddress: GOODDOLLAR_TOKEN_ADDRESS,
    tokenSymbol: 'G$',
    tokenDecimals: 18,
    chainId: celo.id,
    adminPrivateKey: process.env.REWARDS_WALLET_PRIVATE_KEY as Address
  });

  log.info('Gooddollar contribution rewards contract deployed', {
    ...result,
    week,
    season: currentSeason.start
  });
}
