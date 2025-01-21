import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { sendPointsForMiscEvent } from '@packages/scoutgame/points/builderEvents/sendPointsForMiscEvent';
import { getCurrentSeasonStart } from '@packages/dates/utils';
async function query() {
  const scout = await prisma.scout.findFirst({
    where: { displayName: 'Mike.Gre.sol' },
    // select: {
    //   builderNfts: {
    //     where: {
    //       season: getCurrentSeasonStart()
    //     },
    //     select: {
    //       nftSoldEvents: {
    //         select: {
    //           scoutId: true,
    //           tokensPurchased: true
    //         }
    //       }
    //     }
    //   }
    // },
    include: {
      nftPurchaseEvents: {
        select: {
          txHash: true,
          createdAt: true,
          pointsValue: true,
          tokensPurchased: true,
          walletAddress: true,
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
}

query();
