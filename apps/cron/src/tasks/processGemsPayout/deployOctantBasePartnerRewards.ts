import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { createThirdwebAirdropContract } from '@packages/blockchain/airdrop/createThirdwebAirdropContract';
import { getCurrentSeason } from '@packages/dates/utils';
import { getBuilderEventsForPartnerRewards } from '@packages/scoutgame/partnerReward/getBuilderEventsForPartnerReward';
import { parseUnits, type Address } from 'viem';
import { base } from 'viem/chains';

const usdcTokenDecimals = 6;
const baseUsdcTokenAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const OCTANT_BASE_CONTRIBUTION_REWARD_AMOUNT = parseUnits('75', usdcTokenDecimals).toString();

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

  if (recipients.length === 0) {
    log.info('No recipients found, skipping octant & base rewards contract deployment', {
      season: currentSeason.start,
      week
    });
    return;
  }

  const { airdropContractAddress, deployTxHash, merkleTree, blockNumber } = await createThirdwebAirdropContract({
    adminPrivateKey: process.env.OCTANT_BASE_CONTRIBUTION_REWARD_ADMIN_PRIVATE_KEY as Address,
    chainId: base.id,
    // 30 days in seconds from now
    expirationTimestamp: BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30),
    tokenAddress: baseUsdcTokenAddress,
    recipients: recipients.map((recipient) => ({
      address: recipient.address,
      amount: OCTANT_BASE_CONTRIBUTION_REWARD_AMOUNT
    })),
    nullAddressAmount: parseUnits('0.001', usdcTokenDecimals).toString()
  });

  log.info('Octant & Base contribution rewards contract deployed', {
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
      tokenAddress: baseUsdcTokenAddress,
      tokenSymbol: 'USDC',
      tokenDecimals: usdcTokenDecimals,
      partner: 'octant_base_contribution',
      deployTxHash,
      // TODO: Add ipfs cid
      ipfsCid: '',
      merkleTreeJson: merkleTree,
      provider: 'thirdweb',
      blockNumber,
      rewardPayouts: {
        createMany: {
          data: recipients.map((recipient) => ({
            amount: OCTANT_BASE_CONTRIBUTION_REWARD_AMOUNT,
            walletAddress: recipient.address,
            meta: {
              prLink: recipient.prLink
            }
          }))
        }
      }
    }
  });
}
