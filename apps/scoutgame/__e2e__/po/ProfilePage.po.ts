import type { Page } from '@playwright/test';

import { GeneralPageLayout } from './GeneralPageLayout.po';

export class ProfilePage extends GeneralPageLayout {
  constructor(
    protected page: Page,
    public container = page.locator('data-test=profile-page'),
    public noGithubProfileView = page.locator('data-test=developer-profile-no-github'),
    public developerStats = page.locator('data-test=developer-stats')
  ) {
    super(page);
  }
}
