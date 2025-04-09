import { prisma } from '@charmverse/core/prisma-client';
import type { SablierMerkleTree } from '@packages/blockchain/airdrop/checkSablierAirdropEligibility';
import { checkSablierAirdropEligibility } from '@packages/blockchain/airdrop/checkSablierAirdropEligibility';
import { checkThirdwebAirdropEligibility } from '@packages/blockchain/airdrop/checkThirdwebAirdropEligibility';
import type { ThirdwebFullMerkleTree } from '@packages/blockchain/airdrop/thirdwebERC20AirdropContract';

export async function checkPartnerRewardEligibility({
  payoutContractId,
  scoutId
}: {
  payoutContractId: string;
  scoutId: string;
}) {
  const contract = await prisma.partnerRewardPayoutContract.findUniqueOrThrow({
    where: {
      id: payoutContractId
    },
    select: {
      provider: true,
      blockNumber: true
    }
  });

  const payout = await prisma.partnerRewardPayout.findFirstOrThrow({
    where: {
      payoutContractId,
      wallet: {
        scout: {
          id: scoutId
        }
      }
    },
    select: {
      claimedAt: true,
      walletAddress: true,
      payoutContract: {
        select: {
          ipfsCid: true,
          merkleTreeJson: true,
          chainId: true,
          contractAddress: true
        }
      }
    }
  });

  if (payout.claimedAt) {
    throw new Error('Partner reward already claimed');
  }

  if (contract.provider === 'thirdweb') {
    const { amount, index, proof } = await checkThirdwebAirdropEligibility({
      recipientAddress: payout.walletAddress as `0x${string}`,
      merkleTreeJson: payout.payoutContract.merkleTreeJson as ThirdwebFullMerkleTree,
      contractAddress: payout.payoutContract.contractAddress as `0x${string}`,
      chainId: payout.payoutContract.chainId,
      blockNumber: payout.payoutContract.blockNumber
    });
    return {
      amount,
      index,
      proof
    };
  }

  const { amount, index, proof } = await checkSablierAirdropEligibility({
    recipientAddress: payout.walletAddress as `0x${string}`,
    merkleTreeJson: payout.payoutContract.merkleTreeJson as SablierMerkleTree,
    contractAddress: payout.payoutContract.contractAddress as `0x${string}`,
    chainId: payout.payoutContract.chainId
  });

  return {
    amount,
    index,
    proof
  };
}
