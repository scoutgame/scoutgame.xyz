import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { createThirdwebAirdropContract } from '@packages/blockchain/airdrop/createThirdwebAirdropContract';
import {
  THIRDWEB_AIRDROP_IMPLEMENTATION_ADDRESS,
  THIRDWEB_AIRDROP_PROXY_FACTORY_ADDRESS
} from '@packages/blockchain/constants';
import { getCurrentSeason } from '@packages/dates/utils';
import { getReferralsToReward } from '@packages/scoutgame/quests/getReferralsToReward';
import { parseUnits } from 'viem';
import { optimism } from 'viem/chains';

const optimismTokenDecimals = 18;
const optimismTokenAddress = '0x4200000000000000000000000000000000000042';

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
    adminPrivateKey: process.env.REFERRAL_CHAMPION_REWARD_ADMIN_PRIVATE_KEY as `0x${string}`,
    chainId: optimism.id,
    // 30 days in seconds from now
    expirationTimestamp: BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30),
    implementationAddress: THIRDWEB_AIRDROP_IMPLEMENTATION_ADDRESS,
    proxyFactoryAddress: THIRDWEB_AIRDROP_PROXY_FACTORY_ADDRESS,
    tokenAddress: optimismTokenAddress,
    recipients,
    tokenDecimals: optimismTokenDecimals,
    nullAddressAmount: 0.001
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
