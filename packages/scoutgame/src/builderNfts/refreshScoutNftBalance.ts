import type { BuilderNftType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { Address } from 'viem';

import { getBuilderNftContractReadonlyClient } from './clients/builderNftContractReadonlyClient';
import { getBuilderNftStarterPackReadonlyClient } from './clients/starterPack/getBuilderContractStarterPackReadonlyClient';

export async function refreshScoutNftBalance({
  wallet,
  tokenId,
  contractAddress,
  nftType
}: {
  wallet: Address;
  tokenId: number;
  contractAddress: Address;
  nftType: BuilderNftType;
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

  const balance = await (nftType === 'starter_pack'
    ? getBuilderNftStarterPackReadonlyClient().balanceOf({
        args: {
          account: wallet,
          id: BigInt(tokenId)
        }
      })
    : getBuilderNftContractReadonlyClient().balanceOf({
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
}
