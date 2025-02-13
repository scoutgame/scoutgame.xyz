import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';

// console.log('current week', getCurrentWeek());

async function query() {
  const scout = await prisma.scout.findFirst({
    where: { farcasterId: 420564 }
    // include: {
    //   partnerRewardEvents: {
    //     orderBy: {
    //       week: 'desc'
    //     }
    //   }
    // }
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
}

query();
