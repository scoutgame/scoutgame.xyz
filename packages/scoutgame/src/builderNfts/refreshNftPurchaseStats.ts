import { prisma } from '@charmverse/core/prisma-client';

export async function refreshNftPurchaseStats({
  scoutId,
  builderId,
  season
}: {
  scoutId: string;
  builderId: string;
  season: string;
}) {
  const [builderNftScouts, scoutNfts] = await Promise.all([
    prisma.scoutNft.findMany({
      where: {
        builderNft: {
          builderId,
          season
        }
      },
      select: {
        balance: true,
        scoutWallet: {
          select: {
            scoutId: true
          }
        }
      }
    }),
    prisma.scoutNft.findMany({
      where: {
        builderNft: {
          season
        },
        scoutWallet: {
          scoutId
        }
      },
      select: {
        balance: true
      }
    })
  ]);

  const uniqueOwners: Set<string> = new Set();
  let nftsSold = 0;
  let nftsPurchased = 0;

  builderNftScouts.forEach((scout) => {
    if (scout.scoutWallet?.scoutId) {
      uniqueOwners.add(scout.scoutWallet.scoutId);
    }
    nftsSold += scout.balance;
  });

  scoutNfts.forEach((scout) => {
    nftsPurchased += scout.balance;
  });

  await prisma.$transaction(async (tx) => {
    await tx.userSeasonStats.upsert({
      where: {
        userId_season: {
          userId: builderId,
          season
        }
      },
      update: {
        nftOwners: uniqueOwners.size,
        nftsSold
      },
      create: {
        nftOwners: uniqueOwners.size,
        nftsSold,
        userId: builderId,
        season
      }
    });

    await tx.userSeasonStats.upsert({
      where: {
        userId_season: {
          userId: scoutId,
          season
        }
      },
      update: {
        nftsPurchased
      },
      create: {
        nftsPurchased,
        userId: scoutId,
        season
      }
    });
  });
}
