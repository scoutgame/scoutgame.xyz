'use server';

import { authActionClient } from '@packages/scoutgame/actions/actionClient';
import { TELEGRAM_OAUTH_BOT_TOKEN } from '@packages/scoutgame/constants';
import { generateHashedSecretKey, validateInitData } from '@packages/scoutgame/telegram/validate';

import { connectTelegramAccount } from './connectTelegramAccount';
import { connectTelegramAccountSchema } from './connectTelegramAccountSchema';

export const connectTelegramAccountAction = authActionClient
  .schema(connectTelegramAccountSchema)
  .action(async ({ ctx, parsedInput }) => {
    if (!TELEGRAM_OAUTH_BOT_TOKEN) {
      throw new Error('Telegram oauth bot token is not set');
    }

    const { id } = validateInitData(
      {
        ...parsedInput,
        id: String(parsedInput.id),
        auth_date: String(parsedInput.auth_date)
      },
      generateHashedSecretKey(TELEGRAM_OAUTH_BOT_TOKEN).toString()
    );
    const userId = ctx.session.scoutId;

    const existingTelegramUser = await connectTelegramAccount({ telegramId: Number(id), userId });

    return { success: true, connectedUser: existingTelegramUser };
  });
