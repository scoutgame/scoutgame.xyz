import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import type { Address } from 'viem';

import { validMintNftPurchaseEvent } from '../builderNfts/constants';
import type { PartialNftPurchaseEvent } from '../points/getTokensCountForWeekWithNormalisation';
import { mapPurchaseEventsToOwnership } from '../points/mapPurchaseEventsToOwnership';

export async function getNftPurchaseEvents({
  week,
  builderId,
  onlyMints = false
}: {
  week: string;
  builderId?: string;
  onlyMints?: boolean;
}): Promise<PartialNftPurchaseEvent[]> {
  const season = getCurrentSeasonStart(week);
  return prisma.nFTPurchaseEvent
    .findMany({
      where: {
        builderEvent: {
          week: {
            lte: week
          }
        },
        builderNft: {
          season,
          builderId
        },
        ...(onlyMints ? validMintNftPurchaseEvent : {})
      },
      select: {
        scoutWallet: {
          select: {
            address: true,
            scoutId: true,
            primary: true
          }
        },
        senderWallet: {
          select: {
            address: true,
            scoutId: true
          }
        },
        tokensPurchased: true,
        builderNft: {
          select: {
            tokenId: true,
            builderId: true,
            nftType: true
          }
        }
      }
    })
    .then((data) =>
      data.map(
        (record) =>
          ({
            ...record,
            from: record.senderWallet,
            to: record.scoutWallet,
            tokenId: record.builderNft.tokenId,
            nftType: record.builderNft.nftType
          }) as PartialNftPurchaseEvent
      )
    );
}

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
  const purchaseEvents = await getNftPurchaseEvents({ week, builderId });
  return computeTokenOwnershipForBuilder({ purchaseEvents });
}

/**
 * Compute the token ownership for a builder
 * @param purchaseEvents - All the purchase events for the builder NFT
 * @returns
 */
export function computeTokenOwnershipForBuilder({
  purchaseEvents
}: {
  purchaseEvents: PartialNftPurchaseEvent[];
}): TokenOwnershipForBuilder {
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
      wallet: wallet.toLowerCase() as Address,
      totalNft: Object.values(nftTypes.default).reduce((sum, tokens) => sum + tokens, 0),
      totalStarter: Object.values(nftTypes.starter_pack).reduce((sum, tokens) => sum + tokens, 0)
    }))
  );

  return {
    byScoutId,
    byWallet
  };
}
