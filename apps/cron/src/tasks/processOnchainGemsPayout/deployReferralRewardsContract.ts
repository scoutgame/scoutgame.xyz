import { optimismTokenAddress, optimismTokenDecimals } from '@packages/blockchain/constants';
import { getCurrentSeason } from '@packages/dates/utils';
import { deployPartnerAirdropContract } from '@packages/scoutgame/partnerRewards/deployPartnerAirdropContract';
import { getReferralsToReward } from '@packages/scoutgame/quests/getReferralsToReward';
import { parseUnits } from 'viem';
import { optimism } from 'viem/chains';

import { log } from './logger';

export async function deployReferralChampionRewardsContract({ week }: { week: string }) {
  const currentSeason = getCurrentSeason(week);

  const recipients = (await getReferralsToReward({ week })).map((recipient) => ({
    address: recipient.address.toLowerCase() as `0x${string}`,
    amount: parseUnits(recipient.opAmount.toString(), optimismTokenDecimals)
  }));

  if (recipients.length === 0) {
    log.info('No referral reward recipients found for the week, skipping referral rewards contract deployment', {
      week,
      season: currentSeason.start
    });
    return;
  }

  const result = await deployPartnerAirdropContract({
    partner: 'optimism_referral_champion',
    week,
    recipients: recipients.map((recipient) => ({
      address: recipient.address,
      amount: recipient.amount,
      meta: {
        week
      }
    })),
    tokenAddress: optimismTokenAddress,
    tokenDecimals: optimismTokenDecimals,
    tokenSymbol: 'OP',
    chainId: optimism.id,
    adminPrivateKey: process.env.REWARDS_WALLET_PRIVATE_KEY as `0x${string}`
  });

  log.info('Referral champion rewards contract deployed', {
    ...result,
    week,
    season: currentSeason.start
  });
}
