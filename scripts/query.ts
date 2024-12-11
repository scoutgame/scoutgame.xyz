import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { sendPointsForMiscEvent } from '@packages/scoutgame/points/builderEvents/sendPointsForMiscEvent';
async function query() {
  await prisma.builderEvent.update({
    where: { id: '7b8354b5-025b-4b35-87fe-158a97a80364' },
    data: {
      week: '2024-W49'
    }
  });
  const scout = await prisma.scout.findFirst({
    where: { path: 'ahmedzian' },
    include: {
      nftPurchaseEvents: {
        select: {
          pointsValue: true,
          tokensPurchased: true,
          builderEvent: {
            select: {
              id: true,
              week: true
            }
          },
          builderNft: {
            select: {
              builder: {
                select: {
                  displayName: true,
                  path: true
                }
              }
            }
          }
        }
      }
    }
  });
  prettyPrint(scout);
  // await sendPointsForMiscEvent({
  //   builderId: scout!.id,
  //   points: 50,
  //   claimed: true,
  //   description: 'Refund for suspended builders: futreall and mdqst',
  //   hideFromNotifications: true,
  //   earnedAs: 'scout'
  // });
}

query();
