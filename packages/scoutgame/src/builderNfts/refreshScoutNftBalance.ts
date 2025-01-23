import type { BuilderNftType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import type { Address } from 'viem';

import { getPreSeasonTwoBuilderNftContractReadonlyClient } from './clients/preseason02/getPreSeasonTwoBuilderNftContractReadonlyClient';
import { getBuilderNftStarterPackReadonlyClient } from './clients/starterPack/getBuilderContractStarterPackReadonlyClient';
import { builderNftChain } from './constants';

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
    ? getBuilderNftStarterPackReadonlyClient({
        chain: builderNftChain,
        contractAddress
      }).balanceOf({
        args: {
          account: wallet,
          id: BigInt(tokenId)
        }
      })
    : getPreSeasonTwoBuilderNftContractReadonlyClient({ chain: builderNftChain, contractAddress }).balanceOf({
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
