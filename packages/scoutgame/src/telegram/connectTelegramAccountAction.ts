'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { TELEGRAM_API_HASH } from '@packages/scoutgame/constants';

import { connectTelegramAccount } from './connectTelegramAccount';
import { connectTelegramAccountSchema } from './connectTelegramAccountSchema';
import { decrypt } from './crypto';

export const connectTelegramAccountAction = authActionClient
  .schema(connectTelegramAccountSchema)
  .action(async ({ ctx, parsedInput }) => {
    if (!TELEGRAM_API_HASH) {
      throw new Error('Telegram API hash is not set');
    }

    const decryptedId = decrypt(parsedInput.id, TELEGRAM_API_HASH);
    const userId = ctx.session.scoutId;
    const { connectedUser } = await connectTelegramAccount({ telegramId: Number(decryptedId), userId });

    return { success: true, connectedUser };
  });
