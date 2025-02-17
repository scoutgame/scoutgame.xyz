import type { Page } from '@playwright/test';

export class TaikoDevelopersPage {
  constructor(
    protected page: Page,
    public getStartedButton = page.locator('data-test=get-started-button'),
    public githubConnectPage = page.locator('data-test=taiko-developers-github-connect-page'),
    public createProjectPage = page.locator('data-test=taiko-developers-create-project-page'),
    public createProjectButton = page.locator('data-test=taiko-developers-create-project-button')
  ) {
    this.page = page;
  }
}
