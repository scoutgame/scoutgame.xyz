import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/dates/utils';

export type DailyClaim = {
  day: number;
  claimed: boolean;
  isBonus?: boolean;
  points: number;
};

export async function getDailyClaims(userId: string): Promise<DailyClaim[]> {
  const currentWeek = getCurrentWeek();
  const dailyClaimEvents = await prisma.scoutDailyClaimEvent.findMany({
    where: {
      userId,
      week: currentWeek
    },
    orderBy: {
      dayOfWeek: 'asc'
    },
    select: {
      dayOfWeek: true,
      event: {
        select: {
          pointsReceipts: true
        }
      }
    }
  });

  const dailyClaimStreakEvent = await prisma.scoutDailyClaimStreakEvent.findFirst({
    where: {
      userId,
      week: currentWeek
    },
    select: {
      event: {
        select: {
          pointsReceipts: true
        }
      }
    }
  });

  return new Array(7)
    .fill(null)
    .map((_, index) => {
      const dailyClaimEvent = dailyClaimEvents.find((_dailyClaimEvent) => _dailyClaimEvent.dayOfWeek === index + 1);
      const points = dailyClaimEvent?.event?.pointsReceipts[0]?.value || 0;
      const streakPoints = dailyClaimStreakEvent?.event?.pointsReceipts[0]?.value || 0;

      const dailyClaimInfo = {
        day: index + 1,
        claimed: !!dailyClaimEvent,
        isBonus: false,
        points
      };

      // For the last day of the week, return 2 claims: one for the daily claim and one for the bonus claim
      if (index === 6) {
        return [
          dailyClaimInfo,
          { ...dailyClaimInfo, points: streakPoints, claimed: !!dailyClaimStreakEvent, isBonus: true }
        ];
      }

      return [dailyClaimInfo];
    })
    .flat();
}
