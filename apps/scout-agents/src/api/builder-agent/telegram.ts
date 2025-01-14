import { sendTelegramChatMessage } from '@packages/telegram/sendTelegramChatMessage';
import type { IncomingTelegramMessage } from '@packages/telegram/types';
import type Koa from 'koa';
import KoaRouter from 'koa-router';
import { SCOUT_AGENT_BUILDER_TELEGRAM_BOT_TOKEN } from 'src/agents/constants';

async function telegramHandler(ctx: Koa.Context) {
  const { message } = ctx.request.body as IncomingTelegramMessage;
  await sendTelegramChatMessage({
    token: SCOUT_AGENT_BUILDER_TELEGRAM_BOT_TOKEN,
    chatId: message.chat.id,
    text: message.text
  });

  ctx.status = 200;
}

export const builderAgentTelegramRouter = new KoaRouter({
  prefix: '/api/builder-agent/telegram'
}).post('/', telegramHandler);
