import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { validMintNftPurchaseEvent } from '@packages/scoutgame/builderNfts/constants';
import { sendPointsForMiscEvent } from '@packages/scoutgame/points/builderEvents/sendPointsForMiscEvent';

async function deleteBuilderAndRedistributePoints({ builderPath }: { builderPath: string }) {
  const builder = await prisma.scout.findUnique({
    where: {
      path: builderPath
    }
  });

  if (!builder) {
    throw new Error(`Builder with path ${builderPath} not found`);
  }

  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderNft: {
        season: getCurrentSeasonStart(),
        builder: {
          path: builderPath
        }
      }
    },
    select: {
      id: true,
      tokensPurchased: true,
      scoutWallet: {
        select: {
          scoutId: true
        }
      },
      senderWallet: {
        select: {
          scoutId: true
        }
      }
    }
  });

  const nftPurchaseEventIds = nftPurchaseEvents.map((nftPurchaseEvent) => nftPurchaseEvent.id);
  const nftPurchaseEventsRecord: Record<string, number> = {};
  nftPurchaseEvents.forEach((nftPurchaseEvent) => {
    if (nftPurchaseEvent.scoutWallet?.scoutId) {
      if (!nftPurchaseEventsRecord[nftPurchaseEvent.scoutWallet.scoutId]) {
        nftPurchaseEventsRecord[nftPurchaseEvent.scoutWallet.scoutId] = 0;
      }
      nftPurchaseEventsRecord[nftPurchaseEvent.scoutWallet.scoutId] += nftPurchaseEvent.tokensPurchased;
    }

    if (nftPurchaseEvent.senderWallet?.scoutId) {
      if (!nftPurchaseEventsRecord[nftPurchaseEvent.senderWallet.scoutId]) {
        nftPurchaseEventsRecord[nftPurchaseEvent.senderWallet.scoutId] = 0;
      }
      nftPurchaseEventsRecord[nftPurchaseEvent.senderWallet.scoutId] -= nftPurchaseEvent.tokensPurchased;
    }
  });

  await prisma.$transaction(
    async (tx) => {
      await prisma.scout.update({
        where: {
          path: builderPath
        },
        data: {
          deletedAt: new Date()
        }
      });
      await prisma.nFTPurchaseEvent.deleteMany({
        where: {
          id: {
            in: nftPurchaseEventIds
          }
        }
      });
      for (const [scoutId, tokensPurchased] of Object.entries(nftPurchaseEventsRecord)) {
        const points = tokensPurchased * 20;
        await sendPointsForMiscEvent({
          tx,
          builderId: scoutId,
          points,
          description: `You received a ${points} point gift from Scout Game`,
          claimed: true,
          earnedAs: 'scout'
        });
        await prisma.userSeasonStats.update({
          where: {
            userId_season: {
              userId: scoutId,
              season: getCurrentSeasonStart()
            }
          },
          data: {
            nftsPurchased: {
              decrement: tokensPurchased
            }
          }
        });
      }
    },
    {
      timeout: 60000
    }
  );
}

deleteBuilderAndRedistributePoints({
  builderPath: 'path'
});
