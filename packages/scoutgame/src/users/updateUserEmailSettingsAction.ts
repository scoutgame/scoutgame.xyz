'use server';

import { authActionClient } from '../actions/actionClient';

import { updateUserEmailSettings } from './updateUserEmailSettings';
import { updateUserEmailSettingsSchema } from './updateUserEmailSettingsSchema';

export const updateUserEmailSettingsAction = authActionClient
  .metadata({ actionName: 'update-user-email-settings' })
  .schema(updateUserEmailSettingsSchema)
  .action(async ({ parsedInput, ctx }) => {
    await updateUserEmailSettings({
      userId: ctx.session.scoutId,
      email: parsedInput.email,
      sendTransactionEmails: parsedInput.sendTransactionEmails,
      sendMarketing: parsedInput.sendMarketing
    });

    return { success: true };
  });
