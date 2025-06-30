import { log } from '@charmverse/core/log';
import { deleteMixpanelProfiles } from '@packages/mixpanel/deleteUserProfiles';

export async function deleteExternalProfiles(users: { id: string; email: string | null }[]) {
  await deleteMixpanelProfiles(users);
  log.info(`Deleted ${users.length} profiles from Mixpanel`);
}
