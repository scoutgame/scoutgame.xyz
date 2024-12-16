import type { Scout } from '@charmverse/core/prisma';

import type { LoopsUser } from './client';
import { isEnabled, createOrUpdateContact } from './client';

type UserFields = Pick<Scout, 'createdAt' | 'email' | 'displayName' | 'sendMarketing'>;

// Creates a user if one does not exist
// Call this whenever a user toggles subscriptions, ie. "emailNewsletter", or update their email
export async function registerLoopsContact(user: UserFields, source: string) {
  if (!isEnabled) {
    return { success: false, isNewContact: false };
  }
  return createOrUpdateContact({
    ...getLoopsUser(user),
    source
  });
}

function getLoopsUser(user: UserFields): Pick<LoopsUser, 'email' | 'createdAt' | 'firstName' | 'subscribed'> {
  if (!user.email) {
    throw new Error('User does not have an email');
  }
  return {
    firstName: user.displayName,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    subscribed: !!user.sendMarketing
  };
}
