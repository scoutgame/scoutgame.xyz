'use server';

import { authActionClient } from '@packages/scoutgame/actions/actionClient';

import { mergeUserAccount } from './mergeUserAccount';
import { mergeUserAccountSchema } from './mergeUserAccountSchema';

export const mergeUserAccountAction = authActionClient
  .metadata({
    actionName: 'merge_user_account'
  })
  .schema(mergeUserAccountSchema)
  .action(async ({ ctx, parsedInput }) => {
    const scoutId = ctx.session.scoutId;
    await mergeUserAccount({
      userId: scoutId,
      farcasterId: parsedInput.farcasterId,
      telegramId: parsedInput.telegramId
    });

    return {
      success: true
    };
  });
