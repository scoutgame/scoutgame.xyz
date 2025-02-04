import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/dates/utils';
import { prettyPrint } from '@packages/utils/strings';

async function query() {
  const scout = await prisma.scout.findFirst({
    where: { path: 'matt' }
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
