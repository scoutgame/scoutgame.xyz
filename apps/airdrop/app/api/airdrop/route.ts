import { prisma } from '@charmverse/core/prisma-client';
import { checkThirdwebAirdropEligibility } from '@packages/blockchain/airdrop/checkThirdwebAirdropEligibility';
import type { ThirdwebFullMerkleTree } from '@packages/blockchain/airdrop/thirdwebERC20AirdropContract';
import { getCurrentSeasonStart, getPreviousSeason } from '@packages/dates/utils';
import { NextResponse } from 'next/server';
import type { Address } from 'viem';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  const previousSeason = getPreviousSeason(getCurrentSeasonStart());

  if (!previousSeason) {
    return NextResponse.json({ error: 'No previous season found' }, { status: 400 });
  }

  const airdropClaim = await prisma.airdropClaim.findFirstOrThrow({
    where: {
      season: previousSeason
    }
  });

  const fullMerkleTree = (await fetch(airdropClaim.merkleTreeUrl).then((res) => res.json())) as ThirdwebFullMerkleTree;

  const { hasExpired, isValid, isClaimed, amount, proof } = await checkThirdwebAirdropEligibility({
    recipientAddress: address as Address,
    merkleTreeJson: fullMerkleTree,
    contractAddress: airdropClaim.contractAddress as Address,
    chainId: 8453,
    blockNumber: airdropClaim.blockNumber
  });

  return NextResponse.json({
    hasExpired,
    isValid,
    isClaimed,
    amount,
    proof,
    contractAddress: airdropClaim.contractAddress,
    airdropId: airdropClaim.id
  });
}
