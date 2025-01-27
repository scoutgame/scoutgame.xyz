import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { validMintNftPurchaseEvent } from '@packages/scoutgame/builderNfts/constants';
import { uniqueValues } from '@packages/utils/array';

export type NftSalesData = {
  totalNftsSold: number;
  nftsPaidWithPoints: number;
  nftsPaidWithCrypto: number;
  uniqueHolders: number;
  mintEvents: number;
};

export async function aggregateNftSalesData({
  nftType,
  season
}: {
  nftType: 'default' | 'starter_pack';
  season: ISOWeek;
}): Promise<NftSalesData> {
  const nftsPaidWithPoints = await prisma.nFTPurchaseEvent
    .aggregate({
      where: {
        paidInPoints: true,
        builderNft: {
          nftType,
          season
        }
      },
      _sum: {
        tokensPurchased: true
      }
    })
    .then((data) => data._sum.tokensPurchased || 0);

  const nftsPaidWithCrypto = await prisma.nFTPurchaseEvent
    .aggregate({
      where: {
        paidInPoints: {
          not: true
        },
        builderNft: {
          nftType,
          season
        }
      },
      _sum: {
        tokensPurchased: true
      }
    })
    .then((data) => data._sum.tokensPurchased || 0);

  const uniqueScoutIds = await prisma.nFTPurchaseEvent
    .findMany({
      where: {
        ...validMintNftPurchaseEvent,
        builderNft: {
          nftType,
          season
        }
      },
      select: {
        scoutWallet: {
          select: {
            scoutId: true
          }
        }
      }
    })
    .then((data) => uniqueValues(data.map((item) => item.scoutWallet!.scoutId)));

  const mintEvents = await prisma.nFTPurchaseEvent.count({
    where: validMintNftPurchaseEvent
  });

  return {
    totalNftsSold: nftsPaidWithPoints + nftsPaidWithCrypto,
    nftsPaidWithCrypto,
    nftsPaidWithPoints,
    uniqueHolders: uniqueScoutIds.length,
    mintEvents
  };
}
