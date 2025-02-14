import type { Page } from '@playwright/test';

import { GeneralPageLayout } from './GeneralPageLayout.po';

export class TaikoDevelopersPage extends GeneralPageLayout {
  constructor(
    protected page: Page,
    public githubConnectPage = page.locator('data-test=taiko-developers-github-connect-page'),
    public createProjectPage = page.locator('data-test=taiko-developers-create-project-page'),
    public createProjectButton = page.locator('data-test=taiko-developers-create-project-button')
  ) {
    super(page);
  }
}
