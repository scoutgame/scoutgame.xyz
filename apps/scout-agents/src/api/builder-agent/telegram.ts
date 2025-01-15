import { log } from '@charmverse/core/log';
import { MessageSender } from '@charmverse/core/prisma-client';
import { getTelegramChatHistory } from '@packages/telegram/getTelegramChatHistory';
import { persistTelegramMessage } from '@packages/telegram/persistTelegramMessage';
import { sendTelegramChatMessage } from '@packages/telegram/sendTelegramChatMessage';
import { setTelegramTyping } from '@packages/telegram/setTelegramTyping';
import type { IncomingTelegramMessage } from '@packages/telegram/types';
import type Koa from 'koa';
import KoaRouter from 'koa-router';
import { BuilderAgent } from 'src/agents/BuilderAgent/BuilderAgent.class';
import { SCOUT_AGENT_BUILDER_TELEGRAM_BOT_TOKEN } from 'src/agents/constants';

const CONTEXT_SIZE_MESSAGES = 6;

async function telegramHandler(ctx: Koa.Context) {
  try {
    const { message } = ctx.request.body as IncomingTelegramMessage;

    if (message.entities?.[0].type === 'bot_command') {
      const command = message.text.split(' ')[0];

      if (command !== '/start') {
        if (command === '/build') {
          await sendTelegramChatMessage({
            token: SCOUT_AGENT_BUILDER_TELEGRAM_BOT_TOKEN,
            chatId: message.chat.id,
            text: `Go to Scout Game to join as a developer`,
            url: 'https://t.me/ScoutGameXYZBot/start'
          });
        } else {
          await sendTelegramChatMessage({
            token: SCOUT_AGENT_BUILDER_TELEGRAM_BOT_TOKEN,
            chatId: message.chat.id,
            text: `Unknown command: ${command}`
          });
        }

        ctx.status = 200;

        return;
      }
    }

    await setTelegramTyping({ chatId: message.chat.id, token: SCOUT_AGENT_BUILDER_TELEGRAM_BOT_TOKEN });

    // Ensure only recent messages show. This way, if the user leaves and comes back, their new chat isn't polluted with old messages
    const chatHistory = await getTelegramChatHistory({
      telegramChatId: message.chat.id,
      maxAgeInMinutes: 15,
      limit: CONTEXT_SIZE_MESSAGES
    });

    await persistTelegramMessage({
      message: message.text,
      sender: MessageSender.user,
      conversationTelegramId: BigInt(message.chat.id),
      messageTelegramId: BigInt(message.message_id)
    });

    const builderAgent = new BuilderAgent();

    const response = await builderAgent.handleMessage({
      message: message.text,
      history: chatHistory.map((_message) => ({
        content: _message.message,
        role: _message.sender === 'user' ? 'user' : 'assistant'
      }))
    });

    const dispatchedAgentResponse = await sendTelegramChatMessage({
      token: SCOUT_AGENT_BUILDER_TELEGRAM_BOT_TOKEN,
      chatId: message.chat.id,
      text: response.message,
      parseMode: 'MarkdownV2'
    });

    await persistTelegramMessage({
      message: dispatchedAgentResponse.result.text,
      sender: MessageSender.agent,
      conversationTelegramId: BigInt(message.chat.id),
      messageTelegramId: BigInt(dispatchedAgentResponse.result.message_id),
      toolCalls: response.toolCalls
    });
  } catch (err) {
    log.error('Error handling telegram message', { err });
  }

  // Always return 200 to avoid Telegram retrying the request
  ctx.status = 200;
}

export const builderAgentTelegramRouter = new KoaRouter({
  prefix: '/api/builder-agent/telegram'
}).post('/', telegramHandler);
