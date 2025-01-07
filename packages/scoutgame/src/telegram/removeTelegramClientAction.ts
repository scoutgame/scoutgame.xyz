'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { telegramClients } from '@packages/scoutgame-ui/actions/telegramClient';

export const removeTelegramClientAction = authActionClient
  .metadata({ actionName: 'remove_telegram_client' })
  .action(async ({ ctx }) => {
    const scoutId = ctx.session.scoutId;
    const client = telegramClients[scoutId];
    if (!client) {
      throw new Error('Telegram client not found');
    }
    client.session.delete();
    await client.destroy();
    delete telegramClients[scoutId];
  });
