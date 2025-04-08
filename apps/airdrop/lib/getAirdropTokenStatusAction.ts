'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { generateMerkleTree, getMerkleProofs } from '@charmverse/core/protocol';
import type { Recipient } from '@packages/blockchain/airdrop/createThirdwebAirdropContract';
import { getCurrentSeasonStart, getPreviousSeason } from '@packages/dates/utils';
import { actionClient } from '@packages/nextjs/actions/actionClient';
import type { Address } from 'viem';
import { parseEther, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import * as yup from 'yup';

export type FullMerkleTree = {
  rootHash: string;
  recipients: Recipient[];
  layers: string[];
  totalAirdropAmount: string;
  totalRecipients: number;
};

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

    const previousSeason = getPreviousSeason(getCurrentSeasonStart());

    if (!previousSeason) {
      throw new Error('No previous season found');
    }

    const airdropClaim = await prisma.airdropClaim.findFirstOrThrow({
      where: {
        season: previousSeason
      },
      select: {
        id: true,
        contractAddress: true,
        blockNumber: true,
        merkleTreeUrl: true
      }
    });

    const fullMerkleTree = (await fetch(airdropClaim.merkleTreeUrl).then((res) => res.json())) as FullMerkleTree;

    const claimableAmount =
      fullMerkleTree.recipients.find((recipient) => recipient.address.toLowerCase() === address.toLowerCase())
        ?.amount ?? parseEther('0').toString();

    // Create a public client to interact with the blockchain
    const publicClient = createPublicClient({
      chain: base,
      transport: http()
    });

    // Get TokensClaimed events for this address
    const events = await publicClient.getLogs({
      address: airdropClaim.contractAddress as Address,
      event: {
        type: 'event',
        name: 'TokensClaimed',
        inputs: [
          { type: 'address', name: 'claimer', indexed: true },
          { type: 'address', name: 'receiver', indexed: true },
          { type: 'uint256', name: 'quantityClaimed', indexed: false }
        ]
      },
      args: {
        receiver: address as Address
      },
      fromBlock: airdropClaim.blockNumber
    });

    const isClaimed = events.length > 0;

    const merkleTree = generateMerkleTree(fullMerkleTree.recipients);
    const proofs = getMerkleProofs(merkleTree.tree, {
      address: address as Address,
      amount: claimableAmount
    });

    return {
      airdropId: airdropClaim.id,
      success: true,
      isClaimed,
      claimableAmount,
      proofs,
      contractAddress: airdropClaim.contractAddress
    };
  });
