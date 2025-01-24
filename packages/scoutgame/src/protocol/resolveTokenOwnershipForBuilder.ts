import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import type { Address } from 'viem';
import { getAddress } from 'viem';

import { getNftPurchaseEvents } from '../points/getWeeklyPointsPoolAndBuilders';
import { mapPurchaseEventsToOwnership } from '../points/mapPurchaseEventsToOwnership';

export type TokenOwnershipForBuilder = {
  byScoutId: {
    scoutId: string;
    totalNft: number;
    totalStarter: number;
  }[];
  byWallet: {
    wallet: Address;
    totalNft: number;
    totalStarter: number;
  }[];
};

export async function resolveTokenOwnershipForBuilder({
  week,
  builderId
}: {
  week: ISOWeek;
  builderId: string;
}): Promise<TokenOwnershipForBuilder> {
  const season = getCurrentSeasonStart(week);

  const builderNfts = await prisma.builderNft.findMany({
    where: {
      builderId,
      season
    }
  });

  const purchaseEvents = await getNftPurchaseEvents({ week, builderId });

  const ownership = mapPurchaseEventsToOwnership(purchaseEvents);

  const byScoutId = Object.entries(ownership).map(([scoutId, walletMap]) => {
    const totalNft = Object.values(walletMap).reduce(
      (acc, nftTypes) => acc + Object.values(nftTypes.default).reduce((sum, tokens) => sum + tokens, 0),
      0
    );

    const totalStarter = Object.values(walletMap).reduce(
      (acc, nftTypes) => acc + Object.values(nftTypes.starter_pack).reduce((sum, tokens) => sum + tokens, 0),
      0
    );

    return {
      scoutId,
      totalNft,
      totalStarter
    };
  });

  const byWallet = Object.values(ownership).flatMap((walletMap) =>
    Object.entries(walletMap).map(([wallet, nftTypes]) => ({
      wallet: getAddress(wallet.toLowerCase()),
      totalNft: Object.values(nftTypes.default).reduce((sum, tokens) => sum + tokens, 0),
      totalStarter: Object.values(nftTypes.starter_pack).reduce((sum, tokens) => sum + tokens, 0)
    }))
  );

  return {
    byScoutId,
    byWallet
  };
}
