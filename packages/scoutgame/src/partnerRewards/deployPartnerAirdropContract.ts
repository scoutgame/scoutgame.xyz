import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { createThirdwebAirdropContract } from '@packages/blockchain/airdrop/createThirdwebAirdropContract';
import { getCurrentSeason } from '@packages/dates/utils';

export async function deployPartnerAirdropContract({
  scoutPartnerId,
  week,
  recipients,
  tokenAddress,
  tokenDecimals,
  tokenSymbol,
  chainId,
  adminPrivateKey
}: {
  scoutPartnerId: string;
  week: string;
  recipients: { address: `0x${string}`; amount: bigint; meta: any }[];
  tokenAddress: `0x${string}`;
  tokenDecimals: number;
  tokenSymbol: string;
  chainId: number;
  adminPrivateKey: `0x${string}`;
}) {
  const existingContract = await prisma.partnerRewardPayoutContract.findFirst({
    where: {
      scoutPartnerId,
      week
    }
  });

  if (existingContract) {
    log.warn('Rewards airdrop already exists, skipping deployment', {
      contractAddress: existingContract.contractAddress,
      scoutPartnerId,
      week,
      txHash: existingContract.deployTxHash
    });
    return { txHash: existingContract.deployTxHash, contractAddress: existingContract.contractAddress };
  }

  // Deploy the thirdweb airdrop contract
  const { airdropContractAddress, deployTxHash, merkleTree, blockNumber } = await createThirdwebAirdropContract({
    adminPrivateKey,
    chainId,
    tokenAddress,
    recipients: recipients.map(({ address, amount }) => ({
      address,
      amount: amount.toString()
    })),
    expirationTimestamp: BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30)
  });

  // Record the payout in the database
  await prisma.partnerRewardPayoutContract.create({
    data: {
      chainId,
      contractAddress: airdropContractAddress,
      season: getCurrentSeason(week).start,
      week,
      ipfsCid: '',
      provider: 'thirdweb',
      merkleTreeJson: merkleTree,
      tokenAddress,
      tokenDecimals,
      tokenSymbol,
      scoutPartnerId,
      partner: '',
      deployTxHash,
      blockNumber,
      rewardPayouts: {
        createMany: {
          data: recipients.map(({ address, amount, meta }) => ({
            amount: amount.toString(),
            walletAddress: address,
            meta
          }))
        }
      }
    }
  });

  return { txHash: deployTxHash, contractAddress: airdropContractAddress };
}
