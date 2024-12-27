import { log } from '@charmverse/core/log';
import type { Scout } from '@charmverse/core/prisma';

import type { LoopsUser } from './client';
import { isEnabled, createOrUpdateContact } from './client';
import { sendSignupEvent } from './sendSignupEvent';

type ScoutFields = Pick<Scout, 'createdAt' | 'email' | 'displayName' | 'sendMarketing'>;

// Creates a user if one does not exist
// Call this whenever a user toggles subscriptions, ie. "emailNewsletter", or update their email
export async function registerScout(scout: ScoutFields, source: string) {
  if (!isEnabled) {
    return { success: false, isNewContact: false };
  }
  try {
    const result = await createOrUpdateContact({
      ...getLoopsUser(scout),
      source
    });
    if (result.isNewContact) {
      await sendSignupEvent({ email: scout.email! });
    }
  } catch (error) {
    log.error('Error registering loops contact', { error, scout });
    return { success: false, isNewContact: false };
  }
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
