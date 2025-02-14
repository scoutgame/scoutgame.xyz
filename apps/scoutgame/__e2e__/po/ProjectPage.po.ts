import type { Page } from '@playwright/test';

import { GeneralPageLayout } from './GeneralPageLayout.po';

export class ProjectPage extends GeneralPageLayout {
  constructor(
    protected page: Page,
    public projectNameInput = page.locator('data-test=project-name-input >> input').first(),
    public saveButton = page.locator('data-test=project-form-save-button'),
    public projectName = page.locator('data-test=project-name')
  ) {
    super(page);
  }
}
