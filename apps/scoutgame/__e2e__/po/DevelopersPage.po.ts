import type { Page } from '@playwright/test';

import { GeneralPageLayout } from './GeneralPageLayout.po';

export class DevelopersPage extends GeneralPageLayout {
  constructor(
    protected page: Page,
    public container = page.locator('data-test=builders-page')
  ) {
    super(page);
  }
}
