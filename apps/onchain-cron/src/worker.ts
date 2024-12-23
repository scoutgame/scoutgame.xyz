import { log } from '@charmverse/core/log';
import Router from '@koa/router';
import Koa from 'koa';
import { DateTime } from 'luxon';

import * as middleware from './middleware';
import { issueGemsOnchain } from './tasks/issueGemsOnchain';
import { processAllBuilderActivity } from './tasks/processBuilderActivity';
import { processOnchainGemsPayout } from './tasks/processOnchainGemsPayout/processOnchainGemsPayout';
import { updateAllBuilderCardActivities } from './tasks/updateBuilderCardActivity';

const app = new Koa();
const router = new Router();

// add a task endpoint which will be configured in cron.yml
function addTask(path: string, handler: (ctx: Koa.Context) => any) {
  router.post(path, async (ctx) => {
    // just in case we need to disable cron in production
    if (process.env.DISABLE_CRON === 'true') {
      log.info(`${path}: Cron disabled, skipping`);
      return;
    }
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

addTask('/process-builder-activity', processAllBuilderActivity);

addTask('/update-builder-card-activity', updateAllBuilderCardActivities);

// Onchain tasks -------

// Calculate merkle tree and write to protocol
addTask('/process-onchain-gems-payout', processOnchainGemsPayout);

// Issue receipts for Github Activity via EAS
addTask('/issue-gems-onchain', issueGemsOnchain);

// Standard health check used by Beanstalk -------
router.get('/api/health', middleware.healthCheck);

app.use(middleware.errorHandler).use(router.routes()).use(router.allowedMethods());

export default app;
