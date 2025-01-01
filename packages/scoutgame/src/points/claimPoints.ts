import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';

import type { Season } from '../dates/config';
import { getCurrentSeasonStart } from '../dates/utils';

import { getClaimablePoints } from './getClaimablePoints';

export async function claimPoints({ season = getCurrentSeasonStart(), userId }: { season?: Season; userId: string }) {
  const { points, pointsReceiptIds } = await getClaimablePoints({ season, userId });

  await prisma.$transaction([
    prisma.pointsReceipt.updateMany({
      where: {
        id: {
          in: pointsReceiptIds
        }
      },
      data: {
        claimedAt: new Date()
      }
    }),
    prisma.scout.update({
      where: {
        id: userId
      },
      data: {
        currentBalance: {
          increment: points
        }
      }
    })
  ]);

  trackUserAction('claim_points', { userId });

  return { total: points };
}
