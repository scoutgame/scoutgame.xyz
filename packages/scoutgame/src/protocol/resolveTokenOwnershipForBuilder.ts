import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { getLastBlockOfWeek } from '@packages/blockchain/getLastBlockOfWeek';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { uniqueValues } from '@packages/utils/array';
import type { Address } from 'viem';
import { getAddress } from 'viem';

import { getPreSeasonTwoBuilderNftContractReadonlyClient } from '../builderNfts/clients/preseason02/getPreSeasonTwoBuilderNftContractReadonlyClient';
import { builderNftChain } from '../builderNfts/constants';

export type WalletBuilderNftsOwnership = {
  wallet: Address;
  tokens: Record<BuilderNftType, number>;
};

/**
 * TokenOwnership is a mapping of tokenId -> wallet -> amount
 */
export type TokenOwnership = Record<string, Record<Address, number>>;

export async function resolveTokenOwnershipForBuilder({
  week,
  builderId,
  blockNumber
}: {
  week: ISOWeek;
  blockNumber?: number;
  builderId: string;
}): Promise<WalletBuilderNftsOwnership[]> {
  const season = getCurrentSeasonStart(week);

  blockNumber =
    blockNumber ??
    (await getLastBlockOfWeek({
      week,
      chainId: builderNftChain.id
    }));

  const builderNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      builderId,
      season,
      nftType: BuilderNftType.default
    },
    include: {
      nftSoldEvents: {
        select: {
          scoutWallet: {
            select: {
              address: true
            }
          }
        }
      }
    }
  });

  const builderNftOwnerAddresses = uniqueValues(
    builderNft.nftSoldEvents
      .flatMap(({ scoutWallet }) => (scoutWallet?.address ? getAddress(scoutWallet.address) : undefined))
      .filter((address) => !!address) as Address[]
  );

  const nftBalances = await getPreSeasonTwoBuilderNftContractReadonlyClient({
    chain: builderNftChain,
    contractAddress: builderNft.contractAddress as Address
  }).balanceOfBatch({
    args: {
      accounts: builderNftOwnerAddresses,
      tokenIds: Array.from({ length: builderNftOwnerAddresses.length }, (_, i) => BigInt(builderNft.tokenId))
    }
  });

  const resolvedNftBalances: WalletBuilderNftsOwnership[] = nftBalances.map((_walletBalance, index) => ({
    wallet: builderNftOwnerAddresses[index] as Address,
    tokens: {
      [BuilderNftType.starter_pack]: Number(_walletBalance),
      [BuilderNftType.default]: 0
    }
  }));

  const starterPackNft = await prisma.builderNft.findUnique({
    where: {
      builderId_season_nftType: {
        builderId,
        season,
        nftType: BuilderNftType.starter_pack
      }
    },
    include: {
      nftSoldEvents: {
        select: {
          scoutWallet: {
            select: {
              address: true
            }
          }
        }
      }
    }
  });

  if (starterPackNft) {
    const starterPackNftOwnerAddresses = uniqueValues(
      starterPackNft.nftSoldEvents
        .flatMap(({ scoutWallet }) => (scoutWallet?.address ? getAddress(scoutWallet.address) : undefined))
        .filter((address) => !!address) as Address[]
    );

    const onchainStarterPackBalances = await getPreSeasonTwoBuilderNftContractReadonlyClient({
      chain: builderNftChain,
      contractAddress: starterPackNft.contractAddress as Address
    }).balanceOfBatch({
      args: {
        accounts: starterPackNftOwnerAddresses,
        tokenIds: Array.from({ length: starterPackNftOwnerAddresses.length }, (_, i) => BigInt(starterPackNft.tokenId))
      }
    });

    for (let index = 0; index < starterPackNftOwnerAddresses.length; index++) {
      const account = starterPackNftOwnerAddresses[index];
      const balance = onchainStarterPackBalances[index];

      const existingBalanceIndex = resolvedNftBalances.findIndex((nftBalance) => nftBalance.wallet === account);
      if (existingBalanceIndex !== -1) {
        resolvedNftBalances[existingBalanceIndex].tokens[BuilderNftType.starter_pack] = Number(balance);
      } else {
        resolvedNftBalances.push({
          wallet: account,
          tokens: {
            [BuilderNftType.starter_pack]: Number(balance),
            [BuilderNftType.default]: 0
          }
        });
      }
    }
  }
  return resolvedNftBalances;
}
