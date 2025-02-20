'use server';

import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { TELEGRAM_API_HASH } from '@packages/scoutgame/constants';
import { mergeUserAccount } from '@packages/scoutgame/mergeUserAccount';

import { decrypt } from './crypto';
import { mergeUserTelegramAccountSchema } from './mergeUserTelegramAccountSchema';

export const mergeUserTelegramAccountAction = authActionClient
  .metadata({
    actionName: 'merge_user_telegram_account'
  })
  .schema(mergeUserTelegramAccountSchema)
  .action(async ({ ctx, parsedInput }) => {
    if (!TELEGRAM_API_HASH) {
      throw new Error('Telegram API hash is not set');
    }

    const scoutId = ctx.session.scoutId;
    const { authData, selectedProfile } = parsedInput;
    const decryptedId = decrypt(authData.id, TELEGRAM_API_HASH);
    const telegramId = Number(decryptedId);
    if (!telegramId) {
      throw new Error('Invalid Telegram data');
    }

    const { retainedUserId, mergedUserId } = await mergeUserAccount({
      userId: scoutId,
      telegramId,
      selectedProfile
    });

    trackUserAction('merge_account', {
      userId: scoutId,
      mergedUserId,
      retainedUserId,
      mergedIdentity: 'telegram'
    });
  });
