import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';

async function query() {
  const scout = await prisma.scout.findMany({
    where: { path: 'alfreedom' }
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
<<<<<<< HEAD
  console.log(scout);
=======
  prettyPrint(scout);
>>>>>>> main
}

query();
