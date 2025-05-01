import { prisma } from '@charmverse/core/prisma-client';
import { createThirdwebAirdropContract } from '@packages/blockchain/airdrop/createThirdwebAirdropContract';
import { optimismTokenAddress, optimismTokenDecimals } from '@packages/blockchain/constants';
import { getCurrentSeason } from '@packages/dates/utils';
import { getMatchupRewards } from '@packages/matchup/getMatchupRewards';
import { saveMatchupResults } from '@packages/matchup/saveMatchupResults';
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

  const { txHash, contractAddress } = await deployAirdropContract({
    week,
    chainId: optimism.id,
    adminPrivateKey: process.env.REFERRAL_CHAMPION_REWARD_ADMIN_PRIVATE_KEY as `0x${string}`,
    recipients: recipients.map(({ address, opAmount }) => ({
      address,
      amount: opAmount
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

  const { txHash: devAirdropHash, contractAddress: devAirdropContractAddress } = await deployAirdropContract({
    week,
    chainId: devTokenChain.id,
    adminPrivateKey: process.env.REFERRAL_CHAMPION_REWARD_ADMIN_PRIVATE_KEY as `0x${string}`,
    recipients: recipients.map(({ address, devAmount }) => ({
      address,
      amount: devAmount
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

async function deployAirdropContract({
  week,
  recipients,
  tokenAddress,
  tokenDecimals,
  tokenSymbol,
  chainId,
  adminPrivateKey
}: {
  week: string;
  recipients: { address: `0x${string}`; amount: bigint }[];
  tokenAddress: `0x${string}`;
  tokenDecimals: number;
  tokenSymbol: string;
  chainId: number;
  adminPrivateKey: `0x${string}`;
}) {
  // Deploy the thirdweb airdrop contract
  const { airdropContractAddress, deployTxHash, merkleTree, blockNumber } = await createThirdwebAirdropContract({
    adminPrivateKey,
    chainId,
    tokenAddress,
    recipients: recipients.map(({ address, amount }) => ({
      address,
      amount: amount.toString()
    })),
    nullAddressAmount: parseUnits('0.001', tokenDecimals).toString(),
    expirationTimestamp: BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30)
  });

  // Record the payout in the database
  await prisma.partnerRewardPayoutContract.create({
    data: {
      chainId: optimism.id,
      contractAddress: airdropContractAddress,
      season: getCurrentSeason(week).start,
      week,
      ipfsCid: '',
      provider: 'thirdweb',
      merkleTreeJson: merkleTree,
      tokenAddress,
      tokenDecimals,
      tokenSymbol,
      partner: 'matchup_rewards',
      deployTxHash,
      blockNumber,
      rewardPayouts: {
        createMany: {
          data: recipients.map(({ address, amount }) => ({
            amount: amount.toString(),
            walletAddress: address,
            meta: {
              week,
              position: 'top_3'
            }
          }))
        }
      }
    }
  });

  return { txHash: deployTxHash, contractAddress: airdropContractAddress };
}
