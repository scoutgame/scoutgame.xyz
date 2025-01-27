import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import type { BasicUserInfo } from '@packages/users/interfaces';
import { BasicUserInfoSelect } from '@packages/users/queries';
import { isTruthy } from '@packages/utils/types';

import { validMintNftPurchaseEvent } from '../builderNfts/constants';

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
      },
      ...validMintNftPurchaseEvent
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
