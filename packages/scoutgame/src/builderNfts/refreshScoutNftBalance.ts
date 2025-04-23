import type { BuilderNftType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { Address } from 'viem';

import { getNFTReadonlyClient } from '../protocol/clients/getNFTClient';
import { getStarterNFTReadonlyClient } from '../protocol/clients/getStarterNFTClient';

export async function refreshScoutNftBalance({
  wallet,
  tokenId,
  contractAddress,
  nftType,
  season
}: {
  wallet: Address;
  tokenId: number;
  contractAddress: Address;
  nftType: BuilderNftType;
  season?: string;
}) {
  const existingBuilderNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      tokenId,
      contractAddress: {
        equals: contractAddress,
        mode: 'insensitive'
      }
    }
  });

  const starterPackContract = getStarterNFTReadonlyClient(season);
  const regularContract = getNFTReadonlyClient(season);

  if (!starterPackContract || !regularContract) {
    throw new Error('Missing contract client');
  }

  const balance = await (nftType === 'starter_pack'
    ? starterPackContract.balanceOf({
        args: {
          account: wallet,
          id: BigInt(tokenId)
        }
      })
    : regularContract.balanceOf({
        args: {
          account: wallet,
          tokenId: BigInt(tokenId)
        }
      }));

  await prisma.scoutNft.upsert({
    where: {
      builderNftId_walletAddress: {
        builderNftId: existingBuilderNft.id,
        walletAddress: wallet
      }
    },
    update: {
      balance: Number(balance)
    },
    create: {
      balance: Number(balance),
      walletAddress: wallet,
      builderNftId: existingBuilderNft.id
    }
  });

  return balance;
}
