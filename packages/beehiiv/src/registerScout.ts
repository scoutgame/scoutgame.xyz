import type { Scout } from '@charmverse/core/prisma';

import { isEnabled, createSubscription, unsubscribeSubscription } from './client';
import { deleteSubscriptionByEmail } from './deleteSubscriptionByEmail';

type UserFields = Pick<Scout, 'email' | 'sendMarketing'> & { oldEmail?: string | null };

// Creates a user if one does not exist
// Call this whenever a user toggles subscriptions, ie. "sendMarketing", or update their email
export async function registerScout({ oldEmail, ...user }: UserFields) {
  if (!isEnabled) {
    return;
  }
  if (!user.email) {
    throw new Error('User does not have an email');
  }
  if (oldEmail && oldEmail !== user.email) {
    await deleteSubscriptionByEmail({ email: oldEmail });
  }
  if (user.sendMarketing) {
    return createSubscription({
      email: user.email!,
      reactivate_existing: true
    });
  } else {
    return unsubscribeSubscription({ email: user.email });
  }
}
