import { prisma } from '@charmverse/core/prisma-client';

/**
 * Return the chat history for a given Telegram chat ID, always in chronological order
 * @limit - The number of messages to return, starting from the most recent
 */
export async function getTelegramChatHistory({
  telegramChatId,
  limit
}: {
  telegramChatId: string | number;
  limit?: number;
}) {
  if (!telegramChatId) {
    throw new Error('Telegram chat ID is required');
  }

  let skip = 0;

  if (limit) {
    const totalMessages = await prisma.agentTelegramMessage.count({
      where: {
        conversationTelegramId: Number(telegramChatId)
      }
    });
    // If the total number of messages is less than the limit, set skip to 0
    skip = Math.max(0, totalMessages - Number(limit));
  }

  const history = await prisma.agentTelegramMessage.findMany({
    where: {
      conversationTelegramId: Number(telegramChatId)
    },
    orderBy: {
      createdAt: 'asc'
    },
    skip
  });

  return history;
}
