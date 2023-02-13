import { test as base, expect } from '@playwright/test';
import { v4 } from 'uuid';

import { WebhookSettings } from '../po/settings/webhookSettings.po';
import { generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  spaceSettings: WebhookSettings;
};

const test = base.extend<Fixtures>({
  spaceSettings: ({ page }, use) => use(new WebhookSettings(page))
});

test('Space settings - add a webhook and event namespace options', async ({ page, spaceSettings }) => {
  const { space, user: spaceUser } = await generateUserAndSpace({ spaceName: v4(), isAdmin: true, onboarded: true });
  // go to a page to which we don't have access

  await login({ page, userId: spaceUser.id });

  await spaceSettings.goTo(space.domain);

  await spaceSettings.waitForSpaceSettingsURL();

  await spaceSettings.openSettingsModal();

  // Go to api section
  await spaceSettings.goToTab({ spaceId: space.id, section: 'api' });

  await spaceSettings.webhookUrlInput.fill('https://example.com');
  await spaceSettings.forEachNamespace(async (toggle, namespace) => {
    await expect(toggle).not.toBeChecked();
    await toggle.click();
    await expect(toggle).toBeChecked();
  });
  // save form
  await expect(spaceSettings.saveButton).toBeEnabled();
  await spaceSettings.saveButton.click();
  await expect(spaceSettings.webhookSigningSecret).toBeVisible();

  // Refresh api section
  await spaceSettings.goToTab({ spaceId: space.id, section: 'space' });
  await spaceSettings.goToTab({ spaceId: space.id, section: 'api' });

  await spaceSettings.forEachNamespace(async (toggle) => {
    await expect(toggle).toBeChecked();
  });
});
