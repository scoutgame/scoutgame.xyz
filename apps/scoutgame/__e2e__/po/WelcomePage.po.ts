import type { Page } from '@playwright/test';

import { GeneralPageLayout } from './GeneralPageLayout.po';

export class WelcomePage extends GeneralPageLayout {
  constructor(
    protected page: Page,
    public container = page.locator('data-test=welcome-page'),
    public userEmailInput = page.locator('data-test=onboarding-email >> input'),
    public notifyAboutGrants = page.locator('data-test=onboarding-notify-grants'),
    public acceptTerms = page.locator('data-test=onboarding-accept-terms'),
    public submitExtraDetails = page.locator('data-test=submit-extra-details'),
    public continueButton = page.locator('data-test=continue-button'),
    public howItWorksPage = page.locator('data-test=how-it-works-page'),
    public developersPage = page.locator('data-test=welcome-builders-page'),
    public spamPolicyPage = page.locator('data-test=spam-policy-page')
  ) {
    super(page);
  }
}
