import { getCurrentSeasonStart, getLastWeek } from '@packages/dates/utils';
import { mockGemPayoutEvent, mockScout, mockBuilder, mockWeeklyClaims } from '@packages/testing/database';

import { expect, test } from './test';

test.describe('Claim points', () => {
  test('Claim points and assert current balance', async ({ page, claimPage, utils }) => {
    // add some mock data
    const builder = await mockBuilder({ createNft: true });
    const newUser = await mockScout({ builderId: builder.id });

    await utils.loginAsUserId(newUser.id);

    await mockGemPayoutEvent({
      builderId: builder.id,
      recipientId: newUser.id,
      amount: 10,
      season: getCurrentSeasonStart()
    });

    await mockWeeklyClaims({ week: getLastWeek(), season: getCurrentSeasonStart() });
    await page.goto('/claim');

    await claimPage.claimPointsButton.click();
    await expect(claimPage.successModal).toBeVisible();
    await expect(await claimPage.headerPointsBalance.textContent()).toEqual('10');
  });
});
