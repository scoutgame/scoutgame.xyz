import { mockScout, mockBuilder } from '@packages/testing/database';

import { expect, test } from './test';

test.describe('Profile page', () => {
  test('Should redirect non-logged in users to login page', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForURL('**/login');
    const container = page.locator('data-test=login-page');
    await expect(container).toBeVisible();
  });

  test('An onboarded user can access the profile page', async ({ page, profilePage, utils }) => {
    const scout = await mockScout({
      agreedToTermsAt: new Date(),
      onboardedAt: new Date()
    });
    await utils.loginAsUserId(scout.id);

    await page.goto('/scout');

    const userPill = page.locator('data-test=user-menu-pill');
    await expect(userPill).toBeVisible();
    await userPill.click();
    const profileButton = page.locator('data-test=user-profile-button');
    await expect(profileButton).toBeVisible();
    await profileButton.click();

    // Logged in user should be redirected
    await page.waitForURL('**/profile*');
    await expect(profilePage.container).toBeVisible();

    // make sure the non-dev view is visible
    await expect(profilePage.noGithubProfileView).toBeVisible();
  });

  test('An approved dev can see the dev view', async ({ page, profilePage, utils }) => {
    const builder = await mockBuilder({
      agreedToTermsAt: new Date(),
      onboardedAt: new Date()
    });
    await utils.loginAsUserId(builder.id);

    await page.goto('/profile');

    // Logged in user should be redirected
    await page.waitForURL('**/profile*');
    await expect(profilePage.container).toBeVisible();

    // make sure the dev view is visible
    await expect(profilePage.developerStats).toBeVisible();
  });
});
