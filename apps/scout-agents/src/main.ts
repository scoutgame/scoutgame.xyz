import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import cors from '@koa/cors'; // CORS middleware
import { setTelegramBotWebhook } from '@packages/telegram/setTelegramBotWebhook';
import Koa from 'koa';
import koaBody from 'koa-bodyparser';

import { SCOUT_AGENT_BUILDER_TELEGRAM_BOT_TOKEN } from './agents/constants';
// import { chatRouter } from './api/chat';
import { builderAgentTelegramRouter } from './api/builder-agent/telegram';
import { healthCheckRouter } from './api/health';
import { globalApiErrorHandler } from './middleware';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = new Koa();

// Global Error Handler
app.use(globalApiErrorHandler);

// CORS Middleware
app.use(cors());

// JSON Parser Middleware
app.use(koaBody());

app.use(healthCheckRouter.routes());

app.use(builderAgentTelegramRouter.routes());

app.listen(port, host, () => {
  log.info(`[ ready ] http://${host}:${port}`);
});

async function setupTelegramWebhook() {
  try {
    await setTelegramBotWebhook({
      token: SCOUT_AGENT_BUILDER_TELEGRAM_BOT_TOKEN,
      endpoint: `${process.env.DOMAIN}/api/builder-agent/telegram?api_key=${process.env.AGENT_TELEGRAM_SECRET}`
    });
    log.info('Telegram bot webhook set');
  } catch (error) {
    log.error('Error setting telegram bot webhook', { error });
  }
}

setupTelegramWebhook();
