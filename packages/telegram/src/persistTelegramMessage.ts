import type { AgentTelegramMessage } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ToolCallOutput } from '@packages/llm/types';

import type { IncomingTelegramMessage } from './types';

export async function persistTelegramMessage({
  message,
  sender,
  conversationTelegramId,
  messageTelegramId,
  toolCalls
}: Pick<AgentTelegramMessage, 'message' | 'sender' | 'conversationTelegramId' | 'messageTelegramId'> & {
  toolCalls?: ToolCallOutput[] | null;
}) {
  return prisma.agentTelegramMessage.create({
    data: {
      message,
      sender,
      conversationTelegramId,
      messageTelegramId,
      toolCalls: toolCalls ?? []
    }
  });
}
