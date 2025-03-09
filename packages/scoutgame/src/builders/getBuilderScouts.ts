import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import type { BasicUserInfo } from '@packages/users/interfaces';
import { BasicUserInfoSelect } from '@packages/users/queries';
import { isTruthy } from '@packages/utils/types';

export type ScoutInfo = BasicUserInfo & {
  displayName: string;
  nfts: number;
};

export type BuilderScouts = {
  totalScouts: number;
  totalNftsSold: number;
  scouts: ScoutInfo[];
};

export async function getBuilderScouts(builderId: string): Promise<BuilderScouts> {
  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderEvent: {
        builderId,
        season: getCurrentSeasonStart()
      }
    },
    select: {
      scoutWallet: {
        where: {
          scout: {
            deletedAt: null
          }
        },
        select: {
          scout: {
            select: BasicUserInfoSelect
          }
        }
      },
      tokensPurchased: true
    }
  });

  // TODO: Figure out why there are some events that don't have a scoutWallet
  const validPurchaseEvents = nftPurchaseEvents.filter((e) => e.scoutWallet);

  const uniqueScoutIds = Array.from(
    new Set(validPurchaseEvents.map((event) => event.scoutWallet!.scout.id).filter(isTruthy))
  );
  const scoutsRecord: Record<string, ScoutInfo> = {};

  validPurchaseEvents.forEach((event) => {
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
