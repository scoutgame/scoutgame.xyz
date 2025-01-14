import { POST } from '@packages/utils/http';

import { getTelegramBaseUrl } from './auth';
import type { BotToken } from './auth';

/**
 * Set the webhook for a telegram bot
 */
export async function setTelegramBotWebhook({ token, endpoint }: BotToken & { endpoint: string }) {
  const url = `${getTelegramBaseUrl({ token })}/setWebhook?url=${encodeURIComponent(endpoint)}`;

  await POST(url, undefined, {
    query: {
      url: endpoint
    },
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
