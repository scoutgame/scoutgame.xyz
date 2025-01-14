import { log } from '@charmverse/core/log';
import { POST } from '@packages/utils/http';
import telegramFormatter from 'telegramify-markdown';

import { getTelegramBaseUrl } from './auth';
import type { BotToken } from './auth';

export async function sendTelegramChatMessage({
  chatId,
  text,
  token,
  url,
  parseMode,
  retrying
}: {
  chatId: string | number;
  text: string;
  url?: string;
  parseMode?: 'MarkdownV2';
  retrying?: boolean;
} & BotToken) {
  try {
    const response = await POST(
      `${getTelegramBaseUrl({ token })}/sendMessage`,
      {
        chat_id: chatId,
        text: parseMode === 'MarkdownV2' ? telegramFormatter(text, 'escape') : text,
        parse_mode: parseMode,
        link_preview_options: url
          ? {
              url
            }
          : { is_disabled: true }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response;
  } catch (err: any) {
    log.error('Error sending message Telegram');
    log.error(JSON.stringify({ err, text }, null, 2));

    // Only retry once
    if (parseMode && err.error_code === 400 && !retrying) {
      log.info('Reattempting to send message');
      return sendTelegramChatMessage({
        chatId,
        text,
        token,
        parseMode: undefined,
        retrying: true
      });
    }

    throw err;
  }
}
