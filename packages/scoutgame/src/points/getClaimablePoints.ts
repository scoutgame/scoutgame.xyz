import { prisma } from '@charmverse/core/prisma-client';

import type { BonusPartner } from '../bonus';
import type { Season } from '../dates/config';
import { getCurrentSeasonStart, getPreviousSeason } from '../dates/utils';

export async function getClaimablePoints({
  userId,
  season = getCurrentSeasonStart(),
  week
}: {
  userId: string;
  season?: Season;
  week?: string;
}): Promise<{
  points: number;
  bonusPartners: BonusPartner[];
  pointsReceiptIds: string[];
}> {
  const previousSeason = getPreviousSeason(season);
  const claimableSeasons = [previousSeason, season].filter(Boolean);
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
  const bonusPartners = Array.from(new Set(pointsReceipts.map((receipt) => receipt.event.bonusPartner))).filter(
    (bp) => bp !== null
  ) as BonusPartner[];

  return {
    points: totalUnclaimedPoints,
    bonusPartners,
    pointsReceiptIds: pointsReceipts.map((r) => r.id)
  };
}
