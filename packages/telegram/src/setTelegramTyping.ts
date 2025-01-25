import { GET } from '@packages/utils/http';

import { getTelegramBaseUrl } from './auth';
import type { BotToken } from './auth';

export async function setTelegramTyping({ chatId, token }: { chatId: number } & BotToken): Promise<void> {
  await GET(`${getTelegramBaseUrl({ token })}/sendChatAction`, {
    chat_id: chatId,
    action: 'typing'
  });
}
