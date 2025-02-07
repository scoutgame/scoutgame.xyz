import { prisma } from '@charmverse/core/prisma-client';
import type { MerkleTreeDto } from '@packages/blockchain/airdrop/checkSablierAirdropEligibility';
import { checkSablierAirdropEligibility } from '@packages/blockchain/airdrop/checkSablierAirdropEligibility';

export async function checkPartnerRewardEligibility({
  payoutContractId,
  scoutId
}: {
  payoutContractId: string;
  scoutId: string;
}) {
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
      wallet: {
        select: {
          address: true
        }
      },
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

  const { amount, index, proof } = await checkSablierAirdropEligibility({
    recipientAddress: payout.wallet.address as `0x${string}`,
    merkleTree: payout.payoutContract.merkleTreeJson as MerkleTreeDto,
    contractAddress: payout.payoutContract.contractAddress as `0x${string}`,
    chainId: payout.payoutContract.chainId
  });

  return {
    amount,
    index,
    proof
  };
}
