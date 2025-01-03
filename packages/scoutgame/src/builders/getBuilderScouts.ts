import { prisma } from '@charmverse/core/prisma-client';
import { isTruthy } from '@packages/utils/types';

import { getCurrentSeasonStart } from '../dates/utils';
import type { BasicUserInfo } from '../users/interfaces';
import { BasicUserInfoSelect } from '../users/queries';

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
      scout: {
        select: BasicUserInfoSelect
      },
      tokensPurchased: true
    }
  });

  const uniqueScoutIds = Array.from(new Set(nftPurchaseEvents.map((event) => event.scout.id).filter(isTruthy)));
  const scoutsRecord: Record<string, ScoutInfo> = {};

  nftPurchaseEvents.forEach((event) => {
    const existingScout = scoutsRecord[event.scout.id];
    if (!existingScout) {
      scoutsRecord[event.scout.id] = {
        ...event.scout,
        nfts: 0
      };
    }
    scoutsRecord[event.scout.id].nfts += event.tokensPurchased;
  });

  const totalNftsSold = Object.values(scoutsRecord).reduce((acc, scout) => acc + scout.nfts, 0);

  return {
    totalScouts: uniqueScoutIds.length,
    totalNftsSold,
    scouts: Object.values(scoutsRecord)
  };
}
