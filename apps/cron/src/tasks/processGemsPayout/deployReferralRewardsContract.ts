import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { createThirdwebAirdropContract } from '@packages/blockchain/airdrop/createThirdwebAirdropContract';
import {
  THIRDWEB_AIRDROP_IMPLEMENTATION_ADDRESS,
  THIRDWEB_AIRDROP_PROXY_FACTORY_ADDRESS
} from '@packages/blockchain/constants';
import { getCurrentSeason } from '@packages/dates/utils';
import { getReferralsToReward } from '@packages/scoutgame/quests/getReferralsToReward';
import { parseEther, parseUnits } from 'viem';
import { base } from 'viem/chains';

const optimismTokenDecimals = 18;
const optimismTokenAddress = '0x4200000000000000000000000000000000000042';

export async function deployReferralChampionRewardsContract({ week }: { week: string }) {
  const currentSeason = getCurrentSeason(week);

  const recipients = await getReferralsToReward({ week });

  if (recipients.length === 0) {
    log.info('No referral reward recipients found for the week, skipping referral rewards contract deployment', {
      week,
      season: currentSeason.start
    });
    return;
  }

  const { airdropContractAddress, deployTxHash, merkleTree } = await createThirdwebAirdropContract({
    adminPrivateKey: process.env.REFERRAL_CHAMPION_REWARD_ADMIN_PRIVATE_KEY as `0x${string}`,
    chainId: base.id,
    // 30 days in seconds from now
    expirationTimestamp: BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30),
    implementationAddress: THIRDWEB_AIRDROP_IMPLEMENTATION_ADDRESS,
    proxyFactoryAddress: THIRDWEB_AIRDROP_PROXY_FACTORY_ADDRESS,
    tokenAddress: '0xfcdc6813a75df7eff31382cb956c1bee4788dd34', // baseUsdcTokenAddress,
    recipients: recipients.map((recipient) => ({
      address: recipient.address as `0x${string}`,
      amount: parseEther(recipient.opAmount.toString()).toString()
    })),
    tokenDecimals: 18,
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
      chainId: base.id,
      contractAddress: airdropContractAddress,
      season: currentSeason.start,
      week,
      ipfsCid: '',
      merkleTreeJson: merkleTree,
      tokenAddress: '0xfcdc6813a75df7eff31382cb956c1bee4788dd34',
      tokenDecimals: 18,
      tokenSymbol: 'DEV',
      partner: 'base_referral_champion',
      deployTxHash,
      rewardPayouts: {
        createMany: {
          data: recipients.map(({ address, opAmount }) => ({
            amount: parseUnits(opAmount.toString(), optimismTokenDecimals).toString(),
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
