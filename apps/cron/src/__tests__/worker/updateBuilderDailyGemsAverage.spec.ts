import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { mockBuilder, mockGemsReceipt } from '@packages/scoutgame/testing/database';
import { DateTime } from 'luxon';

import { updateBuilderDailyGemsAverage } from '../../tasks/updateBuilderDailyGemsAverage/updateBuilderDailyGemsAverage';

it(`Should update the builder daily gems average considering only yesterday's gems receipts`, async () => {
  const yesterday = DateTime.now().setZone('utc').minus({ day: 1 }).startOf('day');
  const dayBeforeYesterday = yesterday.minus({ day: 1 });

  const builders = await Promise.all(Array.from({ length: 3 }).map(() => mockBuilder()));
  const bannedBuilder = await mockBuilder({ builderStatus: 'banned' });
  const deletedBuilder = await mockBuilder({ deletedAt: new Date() });

  // This event will not be considered since the builder is banned
  await mockGemsReceipt({
    builderId: bannedBuilder.id,
    createdAt: yesterday.toJSDate(),
    type: 'daily_commit'
  });

  // This event will not be considered since the builder is deleted
  await mockGemsReceipt({
    builderId: deletedBuilder.id,
    createdAt: yesterday.toJSDate(),
    type: 'third_pr_in_streak'
  });

  await Promise.all(
    builders.map((builder, index) =>
      mockGemsReceipt({
        builderId: builder.id,
        createdAt: yesterday.toJSDate(),
        type: index === 0 ? 'daily_commit' : index === 1 ? 'regular_pr' : 'first_pr'
      })
    )
  );

  // These events will not be considered since they are not from yesterday
  await Promise.all(
    builders.map((builder) =>
      mockGemsReceipt({
        builderId: builder.id,
        createdAt: dayBeforeYesterday.toJSDate(),
        type: 'first_pr'
      })
    )
  );

  const { averageGems, totalBuilders, totalGems } = await updateBuilderDailyGemsAverage();
  expect(totalBuilders).toBe(3);
  expect(totalGems).toBe(1 + 10 + 100);
  expect(averageGems).toBe((1 + 10 + 100) / 3);
});
