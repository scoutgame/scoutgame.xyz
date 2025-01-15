import { log } from '@charmverse/core/log';
import { MessageSender } from '@charmverse/core/prisma-client';
import { getTelegramChatHistory } from '@packages/telegram/getTelegramChatHistory';
import { persistTelegramMessage } from '@packages/telegram/persistTelegramMessage';
import { sendTelegramChatMessage } from '@packages/telegram/sendTelegramChatMessage';
import type { IncomingTelegramMessage } from '@packages/telegram/types';
import { prettyPrint } from '@packages/utils/strings';
import type Koa from 'koa';
import KoaRouter from 'koa-router';
import { BuilderAgent } from 'src/agents/BuilderAgent.class';
import { SCOUT_AGENT_BUILDER_OPENAI_API_KEY, SCOUT_AGENT_BUILDER_TELEGRAM_BOT_TOKEN } from 'src/agents/constants';

const CONTEXT_SIZE_MESSAGES = 6;

async function telegramHandler(ctx: Koa.Context) {
  try {
    const { message } = ctx.request.body as IncomingTelegramMessage;

    const chatHistory = await getTelegramChatHistory({
      telegramChatId: message.chat.id,
      limit: CONTEXT_SIZE_MESSAGES
    });

    await persistTelegramMessage({
      message: message.text,
      sender: MessageSender.user,
      conversationTelegramId: BigInt(message.chat.id),
      messageTelegramId: BigInt(message.message_id)
    });

    const builderAgent = new BuilderAgent({ openAiApiKey: SCOUT_AGENT_BUILDER_OPENAI_API_KEY });

    prettyPrint({
      chatHistory
    });

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
      text: response.message
    });

    await persistTelegramMessage({
      message: dispatchedAgentResponse.result.text,
      sender: MessageSender.agent,
      conversationTelegramId: BigInt(message.chat.id),
      messageTelegramId: BigInt(dispatchedAgentResponse.result.message_id)
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
