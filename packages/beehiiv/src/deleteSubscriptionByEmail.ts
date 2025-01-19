import { log } from '@charmverse/core/log';

import type { BeehiivSubscription } from './client';
import { isEnabled, findSubscriptions, deleteSubscription } from './client';

export async function deleteSubscriptionByEmail({ email }: BeehiivSubscription) {
  if (!isEnabled) {
    log.error('Beehiiv is not enabled to delete subscription', { email });
    return;
  }
  const { data } = await findSubscriptions({ email });
  if (data.length > 0) {
    return deleteSubscription(data[0]);
  }
}
