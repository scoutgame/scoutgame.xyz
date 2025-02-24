import { mockScout } from '@packages/testing/database';

import { expect, test } from './test';

test.describe('Info page', () => {
  test('Open the app to info page', async ({ page, infoPage }) => {
    await page.goto('/info');
    // Logged in user should be redirected
    await page.waitForURL('**/info');

    await expect(infoPage.container).toBeVisible();
  });
  test('Open the app to terms page', async ({ page, infoPage }) => {
    await page.goto('/info/terms');
    // Logged in user should be redirected
    await page.waitForURL('**/info/terms');

    await expect(infoPage.termsContainer).toBeVisible();
  });
  test('Open the app to privacy page', async ({ page, infoPage }) => {
    await page.goto('/info/privacy-policy');
    // Logged in user should be redirected
    await page.waitForURL('**/info/privacy-policy');

    await expect(infoPage.privacyContainer).toBeVisible();
  });
  test('Open the app to dpa page', async ({ page, infoPage }) => {
    await page.goto('/info/dpa');
    // Logged in user should be redirected
    await page.waitForURL('**/info/dpa');

    await expect(infoPage.dpaContainer).toBeVisible();
  });
});

test.describe('Info page partners', () => {
  test('Open Optimism from the scout page', async ({ page, scoutPage, infoPage, utils }) => {
    const newUser = await mockScout();
    await utils.loginAsUserId(newUser.id);

    await page.goto('/scout');
    await expect(scoutPage.optimismPromoCard).toBeVisible();
    await scoutPage.optimismPromoCard.click();

    await expect(infoPage.optimismContainer).toBeVisible();
  });
  test('Open Moxie from the scout page', async ({ page, scoutPage, infoPage, utils }) => {
    const newUser = await mockScout();
    await utils.loginAsUserId(newUser.id);

    await page.goto('/scout');
    // await expect(scoutPage.moxiePromoCard).toBeVisible();
    // await scoutPage.moxiePromoCard.click();

    // await expect(infoPage.moxieContainer).toBeVisible();
  });
});
