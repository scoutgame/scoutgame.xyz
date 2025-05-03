import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { validMintNftPurchaseEvent } from '@packages/scoutgame/builderNfts/constants';
import { sendPointsForMiscEvent } from '@packages/scoutgame/tokens/builderEvents/sendPointsForMiscEvent';

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
      ...validMintNftPurchaseEvent,
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
      }
    }
  });

  const nftPurchaseEventIds = nftPurchaseEvents.map((nftPurchaseEvent) => nftPurchaseEvent.id);
  const nftPurchaseEventsRecord: Record<string, number> = {};
  nftPurchaseEvents.forEach((nftPurchaseEvent) => {
    if (!nftPurchaseEventsRecord[nftPurchaseEvent.scoutWallet!.scoutId]) {
      nftPurchaseEventsRecord[nftPurchaseEvent.scoutWallet!.scoutId] = 0;
    }
    nftPurchaseEventsRecord[nftPurchaseEvent.scoutWallet!.scoutId] += nftPurchaseEvent.tokensPurchased;
  });

  await prisma.$transaction(
    async (tx) => {
      await prisma.scout.delete({
        where: {
          path: builderPath
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
