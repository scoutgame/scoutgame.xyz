import { log } from '@charmverse/core/log';
import { POST } from '@packages/utils/http';
import telegramFormatter from 'telegramify-markdown';

import { getTelegramBaseUrl } from './auth';
import type { BotToken } from './auth';

type SendTelegramMessageResult = {
  ok: boolean;
  result: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username: string;
    };
    chat: {
      id: number;
      first_name: string;
      username: string;
      type: string;
    };
    date: number;
    text: string;
  };
};

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
} & BotToken): Promise<SendTelegramMessageResult> {
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

    return response as SendTelegramMessageResult;
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
