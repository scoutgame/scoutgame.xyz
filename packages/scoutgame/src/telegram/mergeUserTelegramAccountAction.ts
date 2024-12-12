'use server';

import { authActionClient } from '@packages/scoutgame/actions/actionClient';
import { TELEGRAM_BOT_TOKEN } from '@packages/scoutgame/constants';
import { validateInitData } from '@packages/scoutgame/telegram/validate';

import { mergeUserAccount } from '../users/mergeUserAccount';

import { mergeUserTelegramAccountSchema } from './mergeUserTelegramAccountSchema';

export const mergeUserTelegramAccountAction = authActionClient
  .metadata({
    actionName: 'merge_user_telegram_account'
  })
  .schema(mergeUserTelegramAccountSchema)
  .action(async ({ ctx, parsedInput }) => {
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('Telegram bot token is not set');
    }

    const scoutId = ctx.session.scoutId;
    const { authData, selectedProfile } = parsedInput;

    const telegramData = validateInitData(
      {
        ...authData,
        id: String(authData.id),
        auth_date: String(authData.auth_date)
      },
      TELEGRAM_BOT_TOKEN
    );

    const telegramId = Number(telegramData.id);
    if (!telegramId) {
      throw new Error('Invalid Telegram data');
    }

    await mergeUserAccount({
      userId: scoutId,
      telegramId,
      selectedProfile
    });
  });
