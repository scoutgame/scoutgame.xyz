import { prisma } from '@charmverse/core/prisma-client';
import { checkThirdwebAirdropEligibility } from '@packages/blockchain/airdrop/checkThirdwebAirdropEligibility';
import type { ThirdwebFullMerkleTree } from '@packages/blockchain/airdrop/thirdwebERC20AirdropContract';

export async function checkPartnerRewardEligibility({
  payoutContractId,
  scoutId
}: {
  payoutContractId: string;
  scoutId: string;
}) {
  const payout = await prisma.partnerRewardPayout.findFirstOrThrow({
    where: {
      deletedAt: null,
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
          blockNumber: true,
          contractAddress: true
        }
      }
    }
  });

  if (payout.claimedAt) {
    throw new Error('Partner reward already claimed');
  }

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
