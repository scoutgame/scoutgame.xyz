'use server';

import { authActionClient } from '@packages/scoutgame/actions/actionClient';
import { telegramClients } from '@packages/scoutgame-ui/actions/telegramClient';

export const removeTelegramClientAction = authActionClient
  .metadata({ actionName: 'remove_telegram_client' })
  .action(async ({ ctx }) => {
    const scoutId = ctx.session.scoutId;
    delete telegramClients[scoutId];
  });
