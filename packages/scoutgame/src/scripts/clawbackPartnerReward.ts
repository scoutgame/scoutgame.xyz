import { prisma } from '@charmverse/core/prisma-client';
import { clawbackAirdropTokens } from '@packages/blockchain/airdrop/clawbackAirdropTokens';
import { getWalletClient } from '@packages/blockchain/getWalletClient';
import type { Address } from 'viem';

export async function clawbackPartnerReward({
  contractAddress,
  adminPrivateKey
}: {
  contractAddress: Address;
  adminPrivateKey: Address;
}) {
  const payoutContract = await prisma.partnerRewardPayoutContract.findFirstOrThrow({
    where: {
      contractAddress
    },
    select: {
      id: true,
      chainId: true
    }
  });

  const walletClient = getWalletClient({
    chainId: payoutContract.chainId,
    privateKey: adminPrivateKey
  });

  const { hash, balance } = await clawbackAirdropTokens({
    adminPrivateKey,
    chainId: payoutContract.chainId,
    contractAddress,
    recipientAddress: walletClient.account.address
  });

  // Soft delete all partner reward payouts for this payout contract
  await prisma.partnerRewardPayout.updateMany({
    where: {
      payoutContractId: payoutContract.id
    },
    data: {
      deletedAt: new Date()
    }
  });

  return { hash, balance };
}
