import { log } from '@charmverse/core/log';
import { deleteMixpanelProfiles } from '@packages/mixpanel/deleteUserProfiles';
import fs from 'node:fs';

export async function deleteMixpanelProfilesScript() {
  fs.readFile('../../userIds.json', 'utf8', async function (err, data) {
    if (data && !err) {
      const userIds = JSON.parse(data) as { id: string }[];

      if (Array.isArray(userIds) && userIds.every((item) => !!item.id)) {
        try {
          await deleteMixpanelProfiles(userIds);
        } catch (err) {
          log.error('There was an error while importing event sign_up', { err });
        }
      }
    }

    if (err) {
      log.error('There was an error while reading the json file', { err });
    }
  });
}
