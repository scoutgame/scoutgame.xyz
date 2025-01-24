import { prisma } from '@charmverse/core/prisma-client';

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
  console.log(scout);
}

query();
