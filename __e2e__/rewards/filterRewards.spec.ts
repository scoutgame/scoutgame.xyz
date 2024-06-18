import type { BountyStatus } from '@charmverse/core/dist/cjs/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { test, expect } from '__e2e__/testWithFixtures';
import { loginBrowserUser } from '__e2e__/utils/mocks';

import { generateBountyApplication, generateBountyWithSingleApplication } from 'testing/setupDatabase';

test('Display and filter rewards', async ({ rewardPage, page, databasePage }) => {
  const { space, user: admin } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

  const firstReward = await generateBountyWithSingleApplication({
    applicationStatus: 'complete',
    bountyStatus: 'complete',
    bountyCap: 10,
    bountyTitle: 'First Reward',
    spaceId: space.id,
    userId: admin.id
  });

  const firstRewardSecondApplicationIsPaid = await generateBountyApplication({
    applicationStatus: 'paid',
    bountyId: firstReward.id,
    spaceId: space.id,
    userId: admin.id
  });

  const secondReward = await generateBountyWithSingleApplication({
    applicationStatus: 'applied',
    bountyStatus: 'open',
    bountyCap: 10,
    bountyTitle: 'Second Reward',
    spaceId: space.id,
    userId: admin.id
  });

  await loginBrowserUser({ browserPage: page, userId: admin.id });

  await rewardPage.gotoRewardPage({ spaceDomain: space.domain });

  const firstRewardLocator = databasePage.getTableRowByCardId({ cardId: firstReward.page.id });

  const firstRewardApplicationInReviewLocator = databasePage.getTableRowByCardId({
    cardId: firstReward.applications[0].id
  });

  const firstRewardApplicationPaidLocator = databasePage.getTableRowByCardId({
    cardId: firstRewardSecondApplicationIsPaid.id
  });

  const secondRewardLocator = databasePage.getTableRowByCardId({ cardId: secondReward.page.id });

  const secondRewardApplicationPaidLocator = databasePage.getTableRowByCardId({
    cardId: secondReward.applications[0].id
  });

  // Case 1 - all rewards are visible
  await expect(firstRewardLocator).toBeVisible();
  await expect(firstRewardApplicationInReviewLocator).toBeVisible();
  await expect(firstRewardApplicationPaidLocator).toBeVisible();

  await expect(secondRewardLocator).toBeVisible();
  await expect(secondRewardApplicationPaidLocator).toBeVisible();

  // Case 2 - Only second reward (open) is visible
  await databasePage.openFiltersButton().click();

  await databasePage.addFilterButton().click();

  await databasePage.selectFilterProperty('Status');

  await databasePage.selectFilterCondition('is');

  await databasePage.selectFilterOptionValue('open');

  await page.keyboard.press('Escape');

  await expect(firstRewardLocator).not.toBeVisible();
  await expect(firstRewardApplicationInReviewLocator).not.toBeVisible();
  await expect(firstRewardApplicationPaidLocator).not.toBeVisible();

  await expect(secondRewardLocator).toBeVisible();
  await expect(secondRewardApplicationPaidLocator).toBeVisible();

  // Case 3 - Only first reward (approved) is visible
  await databasePage.resetDatabaseFilters();

  await databasePage.openFiltersButton().click();

  await databasePage.addFilterButton().click();

  await databasePage.selectFilterProperty('Status');

  await databasePage.selectFilterCondition('is');

  await databasePage.selectFilterOptionValue('complete' as BountyStatus);

  await page.keyboard.press('Escape');

  await expect(firstRewardLocator).toBeVisible();
  await expect(firstRewardApplicationInReviewLocator).toBeVisible();
  await expect(firstRewardApplicationPaidLocator).toBeVisible();

  await expect(secondRewardLocator).not.toBeVisible();
  await expect(secondRewardApplicationPaidLocator).not.toBeVisible();
});
