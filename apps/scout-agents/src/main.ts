import { log } from '@charmverse/core/log';
import { setBotCommands } from '@packages/telegram/setBotCommands';
import { setTelegramBotWebhook } from '@packages/telegram/setTelegramBotWebhook';

import { SCOUT_AGENT_BUILDER_TELEGRAM_BOT_TOKEN } from './agents/constants';
import { app } from './server';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(port, host, () => {
  log.info(`[ ready ] http://${host}:${port}`);
});

async function setupTelegramWebhook() {
  try {
    await setTelegramBotWebhook({
      token: SCOUT_AGENT_BUILDER_TELEGRAM_BOT_TOKEN,
      endpoint: `${process.env.DOMAIN}/api/builder-agent/telegram?api_key=${process.env.AGENT_TELEGRAM_SECRET}`
    });
    await setBotCommands({
      token: SCOUT_AGENT_BUILDER_TELEGRAM_BOT_TOKEN,
      configuration: {
        commands: [
          {
            command: '/build',
            description: 'Join Scout Game as a developer'
          }
        ]
      }
    });
    log.info('Telegram bot webhook set');
  } catch (error) {
    log.error('Error setting telegram bot webhook', { error });
  }
}

setupTelegramWebhook();
