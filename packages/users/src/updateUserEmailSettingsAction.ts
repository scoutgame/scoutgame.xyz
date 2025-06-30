'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';

import { updateUserEmailSettings } from './updateUserEmailSettings';
import { updateUserEmailSettingsSchema } from './updateUserEmailSettingsSchema';

export const updateUserEmailSettingsAction = authActionClient
  .metadata({ actionName: 'update-user-email-settings' })
  .schema(updateUserEmailSettingsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await updateUserEmailSettings({
      userId: ctx.session.scoutId,
      email: parsedInput.email
    });

    return { success: true, verificationEmailSent: result.verificationEmailSent };
  });
