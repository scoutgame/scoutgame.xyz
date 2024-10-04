import { log } from '@charmverse/core/log';
import Router from '@koa/router';
import Koa from 'koa';
import { DateTime } from 'luxon';

import * as middleware from './middleware';
import { processGemsPayout } from './tasks/processGemsPayout';
import { processNftMints } from './tasks/processNftMints';
import { processRecentBuilderActivity } from './tasks/processRecentBuilderActivity';
import { sendNotifications } from './tasks/pushNotifications/sendNotifications';

const app = new Koa();
const router = new Router();

// add a task endpoint which will be configured in cron.yml
function addTask(path: string, handler: (ctx: Koa.DefaultContext) => any) {
  router.post(path, async (ctx) => {
    const timer = DateTime.now();
    log.info(`${path}: Task triggered`, { body: ctx.body, headers: ctx.headers });

    try {
      const result = await handler(ctx);

      log.info(`${path}: Completed task`, { durationMinutes: timer.diff(DateTime.now(), 'minutes') });

      ctx.body = result || { success: true };
    } catch (error) {
      log.error(`${path}: Error processing task`, {
        durationMinutes: timer.diff(DateTime.now(), 'minutes'),
        error
      });
      throw error;
    }
  });
}

addTask('/hello-world', (ctx) => {
  log.info('Hello World triggered', { body: ctx.body, headers: ctx.headers });
});

addTask('/process-builder-activity', processRecentBuilderActivity);

addTask('/send-push-notifications', sendNotifications);

addTask('/process-gems-payout', processGemsPayout);

addTask('/process-nft-mints', processNftMints);

// Standard health check used by Beanstalk
router.get('/api/health', middleware.healthCheck);

app.use(middleware.errorHandler).use(router.routes()).use(router.allowedMethods());

export default app;
