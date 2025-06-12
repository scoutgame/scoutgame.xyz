import { log } from '@charmverse/core/log';
import { deleteContact as deleteLoopsContact } from '@packages/loops/client';
import { deleteMixpanelProfiles } from '@packages/mixpanel/deleteUserProfiles';

export async function deleteExternalProfiles(users: { id: string; email: string | null }[]) {
  await deleteMixpanelProfiles(users);
  log.info(`Deleted ${users.length} profiles from Mixpanel`);

  // Delete from email subscriptions
  const deletedRecentlyWithEmail = users.filter((user) => user.email);
  if (deletedRecentlyWithEmail.length > 0) {
    for (const user of deletedRecentlyWithEmail) {
      await deleteLoopsContact({ email: user.email! });
    }
    log.info(`Deleted ${deletedRecentlyWithEmail.length} profiles from Loops.so`);
  }
}
