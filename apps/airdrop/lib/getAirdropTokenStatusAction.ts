'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { checkThirdwebAirdropEligibility } from '@packages/blockchain/airdrop/checkThirdwebAirdropEligibility';
import type { ThirdwebFullMerkleTree } from '@packages/blockchain/airdrop/thirdwebERC20AirdropContract';
import { getCurrentSeasonStart, getPreviousSeason } from '@packages/dates/utils';
import { actionClient } from '@packages/nextjs/actions/actionClient';
import type { Address } from 'viem';
import * as yup from 'yup';

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

    // const previousSeason = getPreviousSeason(getCurrentSeasonStart());

    // if (!previousSeason) {
    //   throw new Error('No previous season found');
    // }

    const airdropClaim = await prisma.airdropClaim.findFirstOrThrow({
      where: {
        season: '2025-W05'
      },
      select: {
        id: true,
        contractAddress: true,
        blockNumber: true,
        merkleTreeUrl: true
      }
    });

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
      proofs: proof,
      contractAddress: airdropClaim.contractAddress,
      hasExpired,
      isValid
    };
  });
