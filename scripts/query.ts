import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { sendPointsForMiscEvent } from '@packages/scoutgame/points/builderEvents/sendPointsForMiscEvent';
import {
  getUserS3FilePath,
  uploadFileToS3,
  uploadUrlToS3,
  getFilenameWithExtension
} from '@packages/aws/uploadToS3Server';
async function query() {
  const scout = await prisma.scout.findMany({
    where: {
      AND: [
        {
          NOT: {
            avatar: {
              contains: 'charmverse'
            }
          }
        },
        {
          NOT: {
            avatar: {
              contains: 'amazonaws'
            }
          }
        }
      ]
    },
    select: {
      id: true,
      avatar: true
    }
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
  // for (const s of scout) {
  //   console.log('uploading avatar to S3', s.path, s.avatar);
  //   if (!s.avatar) {
  //     break;
  //   }
  //   const pathInS3 = getUserS3FilePath({ userId: s.id, url: getFilenameWithExtension(s.avatar!) });
  //   try {
  //     const { url } = await uploadUrlToS3({ pathInS3, url: s.avatar! });

  //     await prisma.scout.update({
  //       where: { id: s.id },
  //       data: { avatar: url }
  //     });
  //   } catch (e) {
  //     console.error('Failed to save avatar', { error: e, pathInS3 });
  //   }
  // }
}

query();
