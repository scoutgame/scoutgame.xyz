import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';

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
        senderWalletAddress: null,
        builderNft: {
          nftType,
          season
        }
      },
      distinct: ['scoutId'],
      select: {
        scoutId: true
      }
    })
    .then((data) => ({ _count: { scoutId: data.length } }));

  const mintEvents = await prisma.nFTPurchaseEvent.count({
    where: {
      senderWalletAddress: null
    }
  });

  return {
    totalNftsSold: nftsPaidWithPoints + nftsPaidWithCrypto,
    nftsPaidWithCrypto,
    nftsPaidWithPoints,
    uniqueHolders: uniqueScoutIds._count.scoutId,
    mintEvents
  };
}
