'use server';

import { authActionClient } from '@packages/scoutgame/actions/actionClient';
import { TELEGRAM_API_HASH } from '@packages/scoutgame/constants';

import { completeQuests } from '../quests/completeQuests';
import { decrypt } from '../utils/crypto';

import { connectTelegramAccount } from './connectTelegramAccount';
import { connectTelegramAccountSchema } from './connectTelegramAccountSchema';

export const connectTelegramAccountAction = authActionClient
  .schema(connectTelegramAccountSchema)
  .action(async ({ ctx, parsedInput }) => {
    if (!TELEGRAM_API_HASH) {
      throw new Error('Telegram API hash is not set');
    }

    const decryptedId = decrypt(parsedInput.id, TELEGRAM_API_HASH);
    const userId = ctx.session.scoutId;
    const existingTelegramUser = await connectTelegramAccount({ telegramId: Number(decryptedId), userId });

    await completeQuests(userId, ['link-telegram-account']);

    return { success: true, connectedUser: existingTelegramUser };
  });
