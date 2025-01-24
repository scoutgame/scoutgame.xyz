import { prisma } from '@charmverse/core/prisma-client';

import { getTelegramChatHistory } from '../getTelegramChatHistory';

describe('getTelegramChatHistory', () => {
  const firstChatId = Math.floor(Math.random() * 1000000000);
  const firstChatMessages = 10;
  const firstChatMessagesInput = Array.from({ length: firstChatMessages }, (_, index) => `First Chat Message ${index}`);

  const secondChatId = Math.floor(Math.random() * 1000000000);
  const secondChatMessages = 5;

  beforeAll(async () => {
    const olderMessagesCount = 6;

    await prisma.agentTelegramMessage.createMany({
      data: firstChatMessagesInput.map((message, index) => ({
        conversationTelegramId: firstChatId,
        messageTelegramId: index,
        message,
        sender: index % 2 === 0 ? 'user' : 'agent',
        // We want the last 4 messages to be recent, and the first 6 to be over half an hour old
        sentAt: new Date(
          Date.now() -
            (index < olderMessagesCount
              ? (olderMessagesCount - index - 1) * 3 + 30
              : (firstChatMessages - index - 1) * 3) *
              60 *
              1000
        )
      }))
    });

    // Create separate convo to test that we can get history for a specific chat
    await prisma.agentTelegramMessage.createMany({
      data: Array.from({ length: secondChatMessages }, (_, index) => ({
        conversationTelegramId: secondChatId,
        messageTelegramId: index,
        message: `Second Chat Message ${index}`,
        sender: index % 2 === 0 ? 'user' : 'agent'
      }))
    });
  });

  it('should return the chat history for a specific chat in ascending order', async () => {
    const history = await getTelegramChatHistory({ telegramChatId: firstChatId });
    expect(history.length).toBe(firstChatMessages);

    for (let i = 0; i < firstChatMessages; i++) {
      expect(history[i].message).toBe(`First Chat Message ${i}`);
      expect(history[i].conversationTelegramId).toBe(BigInt(firstChatId));

      if (i > 0) {
        expect(history[i].sentAt.valueOf()).toBeGreaterThan(history[i - 1].sentAt.valueOf());
      }
    }
  });

  it('should return only messages more recent than the given maxAgeInMinutes', async () => {
    const history = await getTelegramChatHistory({ telegramChatId: firstChatId, maxAgeInMinutes: 15 });
    expect(history.length).toBe(4);
  });

  it('should return only a specific amount of the most recent messages if limit is provided', async () => {
    const history = await getTelegramChatHistory({ telegramChatId: firstChatId, limit: 2 });

    expect(history.length).toBe(2);

    expect(history[0].message).toBe(`First Chat Message ${firstChatMessages - 2}`);
    expect(history[1].message).toBe(`First Chat Message ${firstChatMessages - 1}`);
  });
});
