import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/dates/utils';
import { mockBuilder } from '@packages/testing/database';

import { claimDailyReward } from '../claimDailyReward';

describe('claimDailyReward', () => {
  it('should throw error if bonus reward is claimed on a non-last day of the week', async () => {
    const builder = await mockBuilder();
    const userId = builder.id;
    const isBonus = true;
    await expect(claimDailyReward({ userId, isBonus, dayOfWeek: 1 })).rejects.toThrow();
  });

  it('should claim regular daily reward', async () => {
    const builder = await mockBuilder();
    const userId = builder.id;

    const data = await claimDailyReward({ userId, isBonus: false, dayOfWeek: 1 });

    const dailyClaimEvent = await prisma.scoutDailyClaimEvent.findFirstOrThrow({
      where: {
        userId,
        dayOfWeek: 1
      }
    });
    const pointsReceipt = await prisma.pointsReceipt.findFirstOrThrow({
      where: {
        recipientId: userId,
        event: {
          dailyClaimEventId: dailyClaimEvent.id,
          type: 'daily_claim'
        }
      }
    });
    const scout = await prisma.scout.findUniqueOrThrow({
      where: {
        id: userId
      },
      select: {
        currentBalance: true
      }
    });

    expect(dailyClaimEvent).toBeDefined();
    expect(pointsReceipt).toBeDefined();
    expect(pointsReceipt.value).toBe(data.points);
    expect(scout.currentBalance).toBe(data.points);
  });
});

describe('claimDailyReward streak', () => {
  it('should claim daily reward streak', async () => {
    const builder = await mockBuilder();
    const userId = builder.id;
    const week = getCurrentWeek();
    let totalPoints = 0;

    for (const dayOfWeek of [1, 2, 3, 4, 5, 6, 7]) {
      const data = await claimDailyReward({ userId, week, dayOfWeek });
      totalPoints += data.points;
    }

    // claim streak
    const data = await claimDailyReward({ userId, isBonus: true, week, dayOfWeek: 7 });
    totalPoints += data.points;
    const dailyStrikePoints = data.points;

    const dailyClaimStreakEvent = await prisma.scoutDailyClaimStreakEvent.findFirstOrThrow({
      where: {
        userId,
        week
      }
    });

    const pointsReceipt = await prisma.pointsReceipt.findFirstOrThrow({
      where: {
        recipientId: userId,
        event: {
          dailyClaimStreakEventId: dailyClaimStreakEvent.id,
          type: 'daily_claim_streak'
        }
      }
    });

    const scout = await prisma.scout.findUniqueOrThrow({
      where: {
        id: userId
      },
      select: {
        currentBalance: true
      }
    });

    expect(dailyClaimStreakEvent).toBeDefined();
    expect(pointsReceipt).toBeDefined();
    expect(pointsReceipt.value).toBe(dailyStrikePoints);
    expect(scout.currentBalance).toBe(totalPoints);
  });

  it('should not allow claiming daily reward streak if not all days are claimed', async () => {
    const builder = await mockBuilder();
    const userId = builder.id;

    await expect(claimDailyReward({ userId, isBonus: true, dayOfWeek: 7 })).rejects.toThrow();
  });
});
