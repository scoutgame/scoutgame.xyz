'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { checkThirdwebAirdropEligibility } from '@packages/blockchain/airdrop/checkThirdwebAirdropEligibility';
import type { ThirdwebFullMerkleTree } from '@packages/blockchain/airdrop/thirdwebERC20AirdropContract';
import { actionClient } from '@packages/nextjs/actions/actionClient';
import type { Address } from 'viem';
import * as yup from 'yup';

export type AirdropClaimStatus = {
  airdropId: string;
  isClaimed: boolean;
  claimableAmount: bigint;
  proofs: `0x${string}`[];
  contractAddress: `0x${string}`;
};

export const getAirdropClaimStatusAction = actionClient
  .metadata({ actionName: 'get_airdrop_claim_status' })
  .schema(
    yup.object({
      address: yup.string().required()
    })
  )
  .action(async ({ parsedInput }) => {
    const address = parsedInput.address;

    const airdropClaim = await prisma.airdropClaim.findFirst({
      where: {
        season: '2025-W02'
      },
      select: {
        id: true,
        contractAddress: true,
        blockNumber: true,
        merkleTreeUrl: true
      }
    });

    if (!airdropClaim) {
      return null;
    }

    const fullMerkleTree = (await fetch(airdropClaim.merkleTreeUrl).then((res) =>
      res.json()
    )) as ThirdwebFullMerkleTree;

    const { hasExpired, isValid, isClaimed, amount, proof } = await checkThirdwebAirdropEligibility({
      recipientAddress: address as Address,
      merkleTreeJson: fullMerkleTree,
      contractAddress: airdropClaim.contractAddress as Address,
      chainId: 8453,
      blockNumber: airdropClaim.blockNumber
    });

    return {
      airdropId: airdropClaim.id,
      isClaimed,
      claimableAmount: amount,
      proofs: proof as `0x${string}`[],
      contractAddress: airdropClaim.contractAddress as `0x${string}`,
      hasExpired,
      isValid
    };
  });
