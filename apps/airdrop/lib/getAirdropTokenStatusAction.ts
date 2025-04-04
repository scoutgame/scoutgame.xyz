'use server';

import { prisma } from '@charmverse/core/prisma-client';
import type { ProvableClaim } from '@charmverse/core/protocol';
import { generateMerkleTree, getMerkleProofs } from '@charmverse/core/protocol';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { actionClient } from '@packages/nextjs/actions/actionClient';
import type { Address } from 'viem';
import { parseEther } from 'viem';
import * as yup from 'yup';

import type { FullMerkleTree } from '@/scripts/createAndStoreThirdWebAirdropContract';

// This action needs to be in the scoutgame-ui package because it uses the createUserClaimScreen function which imports components from the scoutgame-ui package
export const getAirdropTokenStatusAction = actionClient
  .metadata({ actionName: 'get_airdrop_token_status' })
  .schema(
    yup.object({
      address: yup.string().required()
    })
  )
  .action(async ({ parsedInput }) => {
    const address = parsedInput.address;

    const airdropClaim = await prisma.airdropClaim.findFirstOrThrow({
      where: {
        season: getCurrentSeasonStart()
      },
      select: {
        id: true,
        merkleTreeJson: true,
        contractAddress: true
      }
    });

    const fullMerkleTree = airdropClaim.merkleTreeJson as FullMerkleTree;

    const claimableAmount =
      fullMerkleTree.recipients.find((recipient) => recipient.address.toLowerCase() === address.toLowerCase())
        ?.amount ?? parseEther('0').toString();

    const isClaimed = await prisma.airdropClaimPayout.findFirst({
      where: {
        airdropClaimId: airdropClaim.id,
        walletAddress: address.toLowerCase()
      }
    });

    const merkleTree = generateMerkleTree(fullMerkleTree.recipients);
    const proofs = getMerkleProofs(merkleTree.tree, {
      address: address as Address,
      amount: claimableAmount
    });

    return {
      airdropId: airdropClaim.id,
      success: true,
      isClaimed: !!isClaimed,
      claimableAmount,
      proofs,
      proofMaxQuantityForWallet: fullMerkleTree.proofMaxQuantityForWallet,
      contractAddress: airdropClaim.contractAddress
    };
  });
