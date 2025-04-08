import { BuilderNftType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { mockBuilder, mockScout, mockUserWeeklyStats } from '@packages/testing/database';

import { expect, test } from './test';

async function mockLeaderboard() {
  const builder = await mockBuilder({ createNft: true, nftSeason: getCurrentSeasonStart() });
  const userWeeklyStats = await mockUserWeeklyStats({
    userId: builder.id,
    week: getCurrentWeek(),
    gemsCollected: 10,
    rank: -1, // hack to make sure this dev appears in the top 10
    season: getCurrentSeasonStart()
  });
  return { builder, userWeeklyStats };
}

test.describe('Scout page', () => {
  test('Open the app and go to profile page as a public user', async ({ page, scoutPage, utils }) => {
    const newUser = await mockScout({
      onboardedAt: null,
      agreedToTermsAt: null,
      avatar: 'https://placehold.co/256'
    });
    await utils.loginAsUserId(newUser.id);

    await page.goto('/');
    // Logged in user should be redirected
    await page.waitForURL('**/scout');

    await expect(scoutPage.container).toBeVisible();
  });
  test('Can navigate to each scouts table tab', async ({ page, scoutPage, utils }) => {
    // add some mock data
    const { builder } = await mockLeaderboard();

    const result = await prisma.builderNft.findMany({
      where: {
        builder: {
          builderStatus: 'approved',
          deletedAt: null
        },
        season: getCurrentSeasonStart(),
        nftType: BuilderNftType.default
      }
    });

    const newUser = await mockScout({
      onboardedAt: new Date(),
      agreedToTermsAt: new Date(),
      avatar: 'https://placehold.co/256'
    });
    await utils.loginAsUserId(newUser.id);

    await page.goto('/scout');
    await expect(scoutPage.container).toBeVisible();

    // Find the first scouts tab which is not hidden
    const scoutTable = scoutPage.container.locator('data-test=scouts-table').last();
    await expect(scoutTable).toBeVisible();

    // verify that a top dev appears
    await expect(scoutPage.container.locator(`data-test=dev-default-card-${builder.id}`)).toBeVisible();

    // check Starter Card tab
    await scoutPage.container.locator('data-test=tab-starter').click();
    await expect(scoutPage.container.locator(`data-test=dev-starter_pack-card-${builder.id}`)).toBeVisible();
  });
});
