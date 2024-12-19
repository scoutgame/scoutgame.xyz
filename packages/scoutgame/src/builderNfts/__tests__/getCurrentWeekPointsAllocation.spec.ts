import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason } from '../../dates';
import { mockBuilder } from '../../testing/database';
import { getCurrentWeekPointsAllocation } from '../getCurrentWeekPointsAllocation';

const pointsPerActiveBuilder = 2500;

describe('getCurrentWeekPointsAllocation', () => {
  const testWeek = `2024-W42-${Math.random().toString(36).substring(2, 15)}`;

  it('should return correct points allocation when there are approved builders with gems collected for the week', async () => {
    const builder1 = await mockBuilder({ builderStatus: 'approved' });
    const builder2 = await mockBuilder({ builderStatus: 'approved' });
    const builderWithoutPoints = await mockBuilder({ builderStatus: 'approved' });

    const excludedBuilder = await mockBuilder({ builderStatus: 'approved' });

    await prisma.userWeeklyStats.createMany({
      data: [
        { week: testWeek, gemsCollected: 10, userId: builder1.id, season: currentSeason },
        { week: testWeek, gemsCollected: 15, season: currentSeason, userId: builder2.id },
        { week: testWeek, gemsCollected: 0, season: currentSeason, userId: builderWithoutPoints.id },
        { week: '2024-W40', gemsCollected: 0, season: currentSeason, userId: excludedBuilder.id }
      ]
    });

    const points = await getCurrentWeekPointsAllocation({ week: testWeek });

    expect(points).toBe(2 * pointsPerActiveBuilder);
  });
});

describe('constants', () => {
  it('pointsPerActiveBuilder should be 2500', () => {
    expect(pointsPerActiveBuilder).toEqual(2500);
  });
});
