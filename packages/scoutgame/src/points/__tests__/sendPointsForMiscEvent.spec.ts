import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { mockBuilder, mockScout } from '@packages/testing/database';

import { sendPointsForMiscEvent } from '../builderEvents/sendPointsForMiscEvent';

describe('sendPointsForMiscEvent', () => {
  it('should send points quietly', async () => {
    const builder = await mockBuilder();
    const mockPoints = 100;
    await sendPointsForMiscEvent({
      builderId: builder.id,
      points: mockPoints,
      hideFromNotifications: true,
      claimed: true,
      description: `Test points`,
      season: getCurrentSeasonStart()
    });
    const updated = await prisma.scout.findUnique({
      where: {
        id: builder.id
      },
      select: {
        currentBalance: true,
        userSeasonStats: true,
        userAllTimeStats: true,
        activities: true
      }
    });
    expect(updated?.currentBalance).toBe(mockPoints);

    // Earned as not provided, so stats should not be affected
    expect(updated?.userSeasonStats[0]).toBeUndefined();
    expect(updated?.userAllTimeStats[0]).toBeUndefined();

    // No activities should be created so that a notification doesn't happen
    expect(updated?.activities[0]).toBeUndefined();
  });

  it('will not allow removing points when the scout balance is insufficient', async () => {
    const builder = await mockBuilder();
    const mockPoints = -100;
    await expect(
      sendPointsForMiscEvent({
        builderId: builder.id,
        points: mockPoints,
        claimed: true,
        description: `Test points`
      })
    ).rejects.toThrow();
  });

  it('should take points away when the value is negative', async () => {
    const scout = await mockScout();
    expect(scout.currentBalance).toBe(0);
    await sendPointsForMiscEvent({
      builderId: scout.id,
      points: 100,
      claimed: true,
      description: `Test points`
    });
    const scout2 = await prisma.scout.findUniqueOrThrow({
      where: {
        id: scout.id
      }
    });
    expect(scout2.currentBalance).toBe(100);
    await sendPointsForMiscEvent({
      builderId: scout.id,
      points: -100,
      claimed: true,
      description: `Test points`
    });
    const scout3 = await prisma.scout.findUniqueOrThrow({
      where: {
        id: scout.id
      }
    });
    expect(scout3.currentBalance).toBe(0);
  });
});
