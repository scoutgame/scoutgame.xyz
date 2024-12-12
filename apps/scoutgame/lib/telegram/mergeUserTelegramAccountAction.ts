import { authActionClient } from '@packages/scoutgame/actions/actionClient';
import { validateTelegramData } from '@packages/scoutgame/telegram/validate';

import { mergeUserAccount } from 'lib/users/mergeUserAccount';

import { mergeUserTelegramAccountSchema } from './mergeUserTelegramAccountSchema';

export const mergeUserTelegramAccountAction = authActionClient
  .metadata({
    actionName: 'merge_user_telegram_account'
  })
  .schema(mergeUserTelegramAccountSchema)
  .action(async ({ ctx, parsedInput }) => {
    const scoutId = ctx.session.scoutId;
    const { initData, profileToKeep } = parsedInput;

    const telegramData = validateTelegramData(initData);

    const telegramId = telegramData.user?.id;
    if (!telegramId) {
      throw new Error('Invalid Telegram data');
    }

    await mergeUserAccount({
      userId: scoutId,
      telegramId,
      profileToKeep
    });
  });
