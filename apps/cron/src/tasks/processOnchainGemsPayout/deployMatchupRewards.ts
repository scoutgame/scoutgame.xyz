import { optimismTokenAddress, optimismTokenDecimals } from '@packages/blockchain/constants';
import { getCurrentSeason } from '@packages/dates/utils';
import { getMatchupRewards } from '@packages/matchup/getMatchupRewards';
import { saveMatchupResults } from '@packages/matchup/saveMatchupResults';
import { deployPartnerAirdropContract } from '@packages/scoutgame/partnerRewards/deployPartnerAirdropContract';
import {
  devTokenContractAddress,
  devTokenDecimals,
  devTokenSymbol,
  devTokenChain
} from '@packages/scoutgame/protocol/constants';
import { optimism } from 'viem/chains';

import { createFreeMatchup } from './createFreeMatchup';
import { log } from './logger';

export async function deployMatchupRewards({ week }: { week: string }) {
  const currentSeason = getCurrentSeason(week);

  const leaderboard = await saveMatchupResults(week);

  log.debug('Matchup leaderboard results saved', {
    week,
    season: currentSeason.start,
    leaderboardLength: leaderboard.length
  });

  const { tokenWinners, freeMatchupWinners } = await getMatchupRewards(week);

  if (tokenWinners.length === 0) {
    log.info('No valid recipients found for matchup rewards, skipping contract deployment', {
      week,
      season: currentSeason.start
    });
    return;
  }

  const { txHash, contractAddress } = await deployPartnerAirdropContract({
    partner: 'matchup_rewards',
    week,
    chainId: optimism.id,
    adminPrivateKey: process.env.REWARDS_WALLET_PRIVATE_KEY as `0x${string}`,
    recipients: tokenWinners.map(({ address, opAmount }) => ({
      address,
      amount: opAmount,
      meta: {
        week,
        position: 'top_3'
      }
    })),
    tokenAddress: optimismTokenAddress,
    tokenDecimals: optimismTokenDecimals,
    tokenSymbol: 'OP'
  });

  log.info('Matchup Optimism rewards contract deployed', {
    txHash,
    contractAddress,
    week,
    season: currentSeason.start,
    recipientsCount: tokenWinners.length
  });

  const { txHash: devAirdropHash, contractAddress: devAirdropContractAddress } = await deployPartnerAirdropContract({
    partner: 'matchup_pool_rewards',
    week,
    chainId: devTokenChain.id,
    adminPrivateKey: process.env.REWARDS_WALLET_PRIVATE_KEY as `0x${string}`,
    recipients: tokenWinners.map(({ address, devAmount }) => ({
      address,
      amount: devAmount,
      meta: {
        week,
        position: 'top_3'
      }
    })),
    tokenAddress: devTokenContractAddress,
    tokenDecimals: devTokenDecimals,
    tokenSymbol: devTokenSymbol
  });

  log.info('Matchup DEV token rewards contract deployed', {
    txHash: devAirdropHash,
    contractAddress: devAirdropContractAddress,
    week,
    season: currentSeason.start,
    recipientsCount: tokenWinners.length
  });

  for (const winner of freeMatchupWinners) {
    await createFreeMatchup({
      scoutId: winner.scoutId,
      week: winner.week
    });
    log.info('Free matchup created', {
      week: winner.week,
      userId: winner.scoutId
    });
  }
}
