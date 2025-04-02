import { log } from '@charmverse/core/log';
import type { Interfaces } from 'mailgun.js/definitions';

import mailgunClient, { DOMAIN } from './mailgunClient';

export async function retrieveBouncedEmails() {
  // retrieve the emails that have been supressed
  let allSupressed: any[] = [];
  let page: string | undefined;
  let hasMore = true;

  try {
    while (hasMore) {
      const response = await (mailgunClient as unknown as Interfaces.IMailgunClient).suppressions.list(
        DOMAIN,
        'bounces',
        { page: page || '' }
      );
      if (response.items && response.items.length > 0) {
        allSupressed = [...allSupressed, ...response.items];
        page = response.pages.next.page;
      } else {
        hasMore = false;
      }
    }
  } catch (e) {
    log.error(`Error retrieving supressed emails. Last page: ${page}`, { error: e });
  }
  return allSupressed;
}
