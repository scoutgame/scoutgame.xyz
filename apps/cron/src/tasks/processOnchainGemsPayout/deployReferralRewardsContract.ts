import { prisma } from '@charmverse/core/prisma-client';
import { createThirdwebAirdropContract } from '@packages/blockchain/airdrop/createThirdwebAirdropContract';
import { optimismTokenAddress, optimismTokenDecimals } from '@packages/blockchain/constants';
import { getCurrentSeason } from '@packages/dates/utils';
import { getReferralsToReward } from '@packages/scoutgame/quests/getReferralsToReward';
import { parseUnits } from 'viem';
import { optimism } from 'viem/chains';

import { log } from './logger';

export async function deployReferralChampionRewardsContract({ week }: { week: string }) {
  const currentSeason = getCurrentSeason(week);

  const recipients = (await getReferralsToReward({ week })).map((recipient) => ({
    address: recipient.address.toLowerCase() as `0x${string}`,
    amount: parseUnits(recipient.opAmount.toString(), optimismTokenDecimals).toString()
  }));

  if (recipients.length === 0) {
    log.info('No referral reward recipients found for the week, skipping referral rewards contract deployment', {
      week,
      season: currentSeason.start
    });
    return;
  }

  const { airdropContractAddress, deployTxHash, merkleTree, blockNumber } = await createThirdwebAirdropContract({
    adminPrivateKey: process.env.REWARDS_WALLET_PRIVATE_KEY as `0x${string}`,
    chainId: optimism.id,
    // 30 days in seconds from now
    expirationTimestamp: BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30),
    tokenAddress: optimismTokenAddress,
    recipients,
    nullAddressAmount: parseUnits('0.001', optimismTokenDecimals).toString()
  });

  log.info('Referral champion rewards contract deployed', {
    hash: deployTxHash,
    contractAddress: airdropContractAddress,
    week,
    season: currentSeason.start
  });

  await prisma.partnerRewardPayoutContract.create({
    data: {
      chainId: optimism.id,
      contractAddress: airdropContractAddress,
      season: currentSeason.start,
      week,
      blockNumber,
      ipfsCid: '',
      merkleTreeJson: merkleTree,
      tokenAddress: optimismTokenAddress,
      tokenDecimals: optimismTokenDecimals,
      tokenSymbol: 'OP',
      provider: 'thirdweb',
      partner: 'optimism_referral_champion',
      deployTxHash,
      rewardPayouts: {
        createMany: {
          data: recipients.map(({ address, amount }) => ({
            amount,
            walletAddress: address,
            meta: {
              week
            }
          }))
        }
      }
    }
  });
}
