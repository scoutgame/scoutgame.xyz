import { prisma } from '@charmverse/core/prisma-client';

/**
 * Return the chat history for a given Telegram chat ID, always in chronological order
 * @limit - The number of messages to return, starting from the most recent
 */
export async function getTelegramChatHistory({
  telegramChatId,
  maxAgeInMinutes,
  limit
}: {
  telegramChatId: string | number | bigint;
  maxAgeInMinutes?: number;
  limit?: number;
}) {
  if (!telegramChatId) {
    throw new Error('Telegram chat ID is required');
  }

  const history = await prisma.agentTelegramMessage.findMany({
    where: {
      conversationTelegramId: Number(telegramChatId),
      sentAt: {
        gte: maxAgeInMinutes ? new Date(Date.now() - maxAgeInMinutes * 60 * 1000) : undefined
      }
    },
    orderBy: {
      sentAt: 'desc'
    },
    take: limit
  });

  return history.reverse();
}
