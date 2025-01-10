import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { sendPointsForMiscEvent } from '@packages/scoutgame/points/builderEvents/sendPointsForMiscEvent';
async function query() {
  const rece;
  const scout = await prisma.scout.count({
    where: { avatar: null }
    // include: {
    //   nftPurchaseEvents: {
    //     select: {
    //       pointsValue: true,
    //       tokensPurchased: true,
    //       builderNFT: {
    //         select: {
    //           builder: {
    //             select: {
    //               displayName: true,
    //               path: true
    //             }
    //           }
    //         }
    //       }
    //     }
    //   }
    // }
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
