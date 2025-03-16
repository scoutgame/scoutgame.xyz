import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import type { BasicUserInfo } from '@packages/users/interfaces';
import { BasicUserInfoSelect } from '@packages/users/queries';
import { isOnchainPlatform } from '@packages/utils/platform';
import { isTruthy } from '@packages/utils/types';

import { scoutProtocolBuilderNftContractAddress, scoutProtocolChainId } from '../protocol/constants';

export type ScoutInfo = BasicUserInfo & {
  displayName: string;
  nfts: number;
};

export type BuilderScouts = {
  totalScouts: number;
  totalNftsSold: number;
  scouts: ScoutInfo[];
};

export async function getBuilderScoutsUsingProtocolBuilderNfts(builderId: string): Promise<BuilderScouts> {
  // Get all NFT purchase events for the builder's NFTs
  const nftPurchaseEvents = await prisma.scoutNft.findMany({
    where: {
      builderNft: {
        builderId,
        season: getCurrentSeasonStart(),
        contractAddress: scoutProtocolBuilderNftContractAddress,
        chainId: scoutProtocolChainId
      }
    },
    select: {
      balance: true,
      walletAddress: true,
      scoutWallet: {
        select: {
          scout: {
            select: {
              ...BasicUserInfoSelect,
              deletedAt: true
            }
          }
        }
      }
    }
  });

  // Filter out deleted scouts and create a map of unique scouts with their NFT counts
  const scoutsRecord: Record<string, ScoutInfo> = {};

  nftPurchaseEvents.forEach((event) => {
    if (!event.scoutWallet?.scout || event.scoutWallet.scout.deletedAt) {
      return;
    }

    const scoutId = event.scoutWallet.scout.id;
    if (!scoutsRecord[scoutId]) {
      scoutsRecord[scoutId] = {
        ...event.scoutWallet.scout,
        nfts: 0
      };
    }
    scoutsRecord[scoutId].nfts += event.balance;
  });

  const scouts = Object.values(scoutsRecord);
  const totalNftsSold = scouts.reduce((acc, scout) => acc + scout.nfts, 0);

  return {
    totalScouts: scouts.length,
    totalNftsSold,
    scouts
  };
}

export async function getBuilderScouts(builderId: string): Promise<BuilderScouts> {
  if (isOnchainPlatform()) {
    return getBuilderScoutsUsingProtocolBuilderNfts(builderId);
  }

  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      // Make sure that the event is not due to a nft burn
      walletAddress: {
        not: null
      },
      builderEvent: {
        builderId,
        season: getCurrentSeasonStart()
      },
      scoutWallet: {
        scout: {
          deletedAt: null
        }
      }
    },
    select: {
      scoutWallet: {
        select: {
          scout: {
            select: BasicUserInfoSelect
          }
        }
      },
      tokensPurchased: true
    }
  });

  const uniqueScoutIds = Array.from(
    new Set(nftPurchaseEvents.map((event) => event.scoutWallet!.scout.id).filter(isTruthy))
  );
  const scoutsRecord: Record<string, ScoutInfo> = {};

  nftPurchaseEvents.forEach((event) => {
    const existingScout = scoutsRecord[event.scoutWallet!.scout.id];
    if (!existingScout) {
      scoutsRecord[event.scoutWallet!.scout.id] = {
        ...event.scoutWallet!.scout,
        nfts: 0
      };
    }
    scoutsRecord[event.scoutWallet!.scout.id].nfts += event.tokensPurchased;
  });

  const totalNftsSold = Object.values(scoutsRecord).reduce((acc, scout) => acc + scout.nfts, 0);

  return {
    totalScouts: uniqueScoutIds.length,
    totalNftsSold,
    scouts: Object.values(scoutsRecord)
  };
}
