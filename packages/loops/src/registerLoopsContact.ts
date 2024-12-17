import type { Scout } from '@charmverse/core/prisma';

import type { LoopsUser } from './client';
import { isEnabled, createOrUpdateContact } from './client';

type ScoutFields = Pick<Scout, 'createdAt' | 'email' | 'displayName' | 'sendMarketing'>;

// Creates a user if one does not exist
// Call this whenever a user toggles subscriptions, ie. "emailNewsletter", or update their email
export async function registerLoopsContact(user: ScoutFields, source: string) {
  if (!isEnabled) {
    return { success: false, isNewContact: false };
  }
  return createOrUpdateContact({
    ...getLoopsUser(user),
    source
  });
}

function getLoopsUser(scout: ScoutFields): Pick<LoopsUser, 'email' | 'createdAt' | 'firstName' | 'subscribed'> {
  if (!scout.email) {
    throw new Error('User does not have an email');
  }
  return {
    firstName: scout.displayName,
    email: scout.email,
    createdAt: scout.createdAt.toISOString(),
    subscribed: !!scout.sendMarketing
  };
}
