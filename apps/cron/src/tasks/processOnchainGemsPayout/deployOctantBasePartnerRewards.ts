import { BASE_USDC_ADDRESS } from '@packages/blockchain/constants';
import { getCurrentSeason } from '@packages/dates/utils';
import { deployPartnerAirdropContract } from '@packages/scoutgame/partnerRewards/deployPartnerAirdropContract';
import { getBuilderEventsForPartnerRewards } from '@packages/scoutgame/partnerRewards/getBuilderEventsForPartnerReward';
import { parseUnits, type Address } from 'viem';
import { base } from 'viem/chains';

import { log } from './logger';

const usdcTokenDecimals = 6;
const OCTANT_BASE_CONTRIBUTION_REWARD_AMOUNT = parseUnits('75', usdcTokenDecimals);

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

  log.info('Found recipients for octant rewards', {
    recipients: recipients.length,
    recipientsMissingWallets: builderEvents.filter((event) => !event.githubUser.builder?.wallets[0]?.address).length
  });

  if (recipients.length === 0) {
    log.info('No recipients found, skipping octant & base rewards contract deployment', {
      season: currentSeason.start,
      week
    });
    return;
  }
  const result = await deployPartnerAirdropContract({
    partner: 'octant_base_contribution',
    week,
    recipients: recipients.map((recipient) => ({
      address: recipient.address,
      amount: OCTANT_BASE_CONTRIBUTION_REWARD_AMOUNT,
      meta: {
        prLink: recipient.prLink
      }
    })),
    tokenAddress: BASE_USDC_ADDRESS,
    tokenSymbol: 'USDC',
    tokenDecimals: usdcTokenDecimals,
    chainId: base.id,
    adminPrivateKey: process.env.OCTANT_BASE_CONTRIBUTION_REWARD_ADMIN_PRIVATE_KEY as Address
  });

  log.info('Octant & Base contribution rewards contract deployed', {
    ...result,
    week,
    season: currentSeason.start
  });
}
