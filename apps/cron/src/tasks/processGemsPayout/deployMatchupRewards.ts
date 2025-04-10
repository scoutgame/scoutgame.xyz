import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { createThirdwebAirdropContract } from '@packages/blockchain/airdrop/createThirdwebAirdropContract';
import { optimismTokenAddress, optimismTokenDecimals } from '@packages/blockchain/constants';
import { getCurrentSeason } from '@packages/dates/utils';
import { getMatchupRewards } from '@packages/matchup/getMatchupRewards';
import { saveMatchupResults } from '@packages/matchup/saveMatchupResults';
import { parseUnits } from 'viem';
import { optimism } from 'viem/chains';

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

  // Deploy the Sablier airdrop contract
  const { airdropContractAddress, deployTxHash, merkleTree, blockNumber } = await createThirdwebAirdropContract({
    adminPrivateKey: process.env.MATCHUP_REWARDS_ADMIN_PRIVATE_KEY as `0x${string}`,
    chainId: optimism.id,
    tokenAddress: optimismTokenAddress,
    recipients: recipients.map(({ address, opAmount }) => ({
      address,
      amount: opAmount.toString()
    })),
    nullAddressAmount: parseUnits('0.001', optimismTokenDecimals).toString(),
    expirationTimestamp: BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30)
  });

  log.info('Matchup rewards contract deployed', {
    hash: deployTxHash,
    contractAddress: airdropContractAddress,
    week,
    season: currentSeason.start,
    recipientsCount: recipients.length
  });

  // Record the payout in the database
  await prisma.partnerRewardPayoutContract.create({
    data: {
      chainId: optimism.id,
      contractAddress: airdropContractAddress,
      season: currentSeason.start,
      week,
      ipfsCid: '',
      merkleTreeJson: merkleTree,
      tokenAddress: optimismTokenAddress,
      tokenDecimals: optimismTokenDecimals,
      tokenSymbol: 'OP',
      partner: 'matchup_rewards',
      deployTxHash,
      blockNumber,
      rewardPayouts: {
        createMany: {
          data: recipients.map(({ address, opAmount }) => ({
            amount: parseUnits(opAmount.toString(), optimismTokenDecimals).toString(),
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
}
