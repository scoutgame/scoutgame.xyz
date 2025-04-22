import { prisma } from '@charmverse/core/prisma-client';
import { getPreviousSeason, getCurrentSeasonStart } from '@packages/dates/utils';
import { isTruthy } from '@packages/utils/types';

export async function getClaimablePoints({
  userId,
  season = getCurrentSeasonStart(),
  week
}: {
  userId: string;
  season?: string;
  week?: string;
}): Promise<{
  points: number;
  pointsReceiptIds: string[];
}> {
  const previousSeason = getPreviousSeason(season);
  const claimableSeasons = [previousSeason, season].filter(isTruthy);
  if (claimableSeasons.length === 0) {
    throw new Error(`No seasons found to claim points: ${season}`);
  }
  const pointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      recipientId: userId,
      claimedAt: null,
      event: {
        week,
        season: {
          in: claimableSeasons
        }
      }
    },
    select: {
      id: true,
      value: true,
      event: {
        select: {
          bonusPartner: true
        }
      }
    }
  });

  const totalUnclaimedPoints = pointsReceipts.reduce((acc, receipt) => acc + receipt.value, 0);

  return {
    points: totalUnclaimedPoints,
    pointsReceiptIds: pointsReceipts.map((r) => r.id)
  };
}
