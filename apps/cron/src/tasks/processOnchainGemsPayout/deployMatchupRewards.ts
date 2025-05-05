import { prisma } from '@charmverse/core/prisma-client';
import { createThirdwebAirdropContract } from '@packages/blockchain/airdrop/createThirdwebAirdropContract';
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
import { parseUnits } from 'viem';
import { optimism } from 'viem/chains';

import { log } from './logger';

export async function deployMatchupRewards({ week }: { week: string }) {
  const currentSeason = getCurrentSeason(week);

  const leaderboard = await saveMatchupResults(week);

  log.debug('Matchup leaderboard results saved', {
    week,
    season: currentSeason.start,
    leaderboardLength: leaderboard.length
  });

  const recipients = await getMatchupRewards(week);

  if (recipients.length === 0) {
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
    recipients: recipients.map(({ address, opAmount }) => ({
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
    recipientsCount: recipients.length
  });

  const { txHash: devAirdropHash, contractAddress: devAirdropContractAddress } = await deployPartnerAirdropContract({
    partner: 'matchup_pool_rewards',
    week,
    chainId: devTokenChain.id,
    adminPrivateKey: process.env.REWARDS_WALLET_PRIVATE_KEY as `0x${string}`,
    recipients: recipients.map(({ address, devAmount }) => ({
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
    recipientsCount: recipients.length
  });
}
