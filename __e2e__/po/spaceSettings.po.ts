// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

import { baseUrl } from 'config/constants';

// capture actions on the pages in signup flow
export class SpaceSettings {
  readonly page: Page;

  readonly spaceNameField: Locator;

  readonly spaceDomainField: Locator;

  readonly submitSpaceUpdateButton: Locator;

  readonly settingsBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.spaceNameField = page.locator('data-test=set-space-name >> input');
    this.spaceDomainField = page.locator('data-test=set-space-domain >> input');
    this.submitSpaceUpdateButton = page.locator('data-test=submit-space-update');
    this.settingsBtn = page.locator('data-test=sidebar-settings');
  }

  async goTo(domain: string) {
    await this.page.goto(`${baseUrl}/${domain}`);
  }

  async openSettingsModal() {
    await this.settingsBtn.click();
  }

  async waitForSpaceSettingsURL(domain?: string) {
    if (domain) {
      await this.page.waitForURL(`**/${domain}/*`);
    } else {
      await this.page.waitForURL('**/*');
    }
  }
}
