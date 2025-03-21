import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { mockBuilder } from '@packages/testing/database';

import { sendPointsForMiscEvent } from '../builderEvents/sendPointsForMiscEvent';

describe('sendPoints', () => {
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
});
