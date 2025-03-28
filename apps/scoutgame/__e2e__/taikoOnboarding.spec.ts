import { prisma } from '@charmverse/core/prisma-client';
import { mockScout, mockGithubUser } from '@packages/testing/database';
import { randomIntFromInterval } from '@packages/testing/generators';

import { expect, test } from './test';

test.describe('Taiko Developer Onboarding flow', () => {
  test('Open the app to taiko page, redirect to taiko partner rewards info page, click register and check utm campaign search params', async ({
    page,
    taikoDevelopersPage,
    loginPage
  }) => {
    await page.goto('/taiko');
    await expect(taikoDevelopersPage.getStartedButton).toBeVisible();
    await taikoDevelopersPage.getStartedButton.click();
    await page.waitForURL('**/login?**');
    await expect(loginPage.container).toBeVisible();

    const searchParams = new URLSearchParams(new URL(page.url()).search);
    const utmCampaign = searchParams.get('utm_campaign');
    expect(utmCampaign).toBeDefined();
    expect(utmCampaign).toContain('taiko');
  });

  test('Sign up as a developer, fill out form and create project', async ({
    page,
    utils,
    welcomePage,
    taikoDevelopersPage,
    projectPage
  }) => {
    const newUser = await mockScout({
      onboardedAt: null,
      agreedToTermsAt: null,
      avatar: 'https://placehold.co/256',
      utmCampaign: 'taiko',
      displayName: 'Test Developer'
    });
    await utils.loginAsUserId(newUser.id);
    await page.goto('/welcome?type=builder');

    await expect(welcomePage.userEmailInput).toBeEditable();
    await expect(welcomePage.notifyAboutGrants).toBeVisible();
    await expect(welcomePage.acceptTerms).toBeVisible();

    const email = `test-${randomIntFromInterval(1, 1000000)}@gmail.com`;
    await welcomePage.userEmailInput.fill(email);

    await welcomePage.acceptTerms.click();
    await welcomePage.submitExtraDetails.click();

    await expect(taikoDevelopersPage.githubConnectPage).toBeVisible();

    // mock step 2
    await prisma.scout.update({
      where: {
        id: newUser.id
      },
      data: {
        builderStatus: 'applied'
      }
    });

    await mockGithubUser({
      builderId: newUser.id
    });

    await page.goto('/welcome?step=3&type=builder');
    await expect(taikoDevelopersPage.createProjectPage).toBeVisible();

    await taikoDevelopersPage.createProjectButton.click();

    await page.waitForURL('/profile/projects/create');

    await expect(projectPage.projectNameInput).toBeVisible();

    await projectPage.projectNameInput.fill('Test Project');
    await projectPage.saveButton.click();

    await page.waitForURL('/p/**');

    const projectName = await projectPage.projectName.textContent();

    expect(projectName).toBe('Test Project');
  });

  test('Taiko register buttons should redirect to correct page', async ({ page, utils, taikoDevelopersPage }) => {
    const newUser = await mockScout({
      onboardedAt: new Date(),
      agreedToTermsAt: new Date(),
      utmCampaign: 'taiko',
      displayName: 'Test Developer'
    });

    await utils.loginAsUserId(newUser.id);

    await page.goto('/taiko');
    await page.waitForURL('/info/partner-rewards/taiko');
    const registerButtonBeforeGithub = taikoDevelopersPage.getStartedButton.locator('a');
    expect(await registerButtonBeforeGithub.getAttribute('href')).toContain('/welcome?type=builder&step=2');

    await mockGithubUser({
      builderId: newUser.id
    });

    await page.goto('/taiko');
    await page.waitForURL('/info/partner-rewards/taiko');
    const registerButtonAfterGithub = taikoDevelopersPage.getStartedButton.locator('a');
    expect(await registerButtonAfterGithub.getAttribute('href')).toContain('/profile/projects/create');
  });
});
