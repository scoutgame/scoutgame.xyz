import { getLogger } from '@charmverse/core/log';
import Router from '@koa/router';
import Koa from 'koa';
import { DateTime } from 'luxon';

import * as middleware from './middleware';
import { alertLowWalletGasBalance } from './tasks/alertLowWalletGasBalance';
import { processAllBuilderActivity } from './tasks/processBuilderActivity';
import { processBuilderOnchainActivity } from './tasks/processBuilderOnchainActivity';
import { processDuneAnalytics } from './tasks/processDuneAnalytics';
import { processGemsPayout } from './tasks/processGemsPayout';
import { processNftMints } from './tasks/processNftMints';
import { processOnchainGemsPayout } from './tasks/processOnchainGemsPayout';
import { sendNotifications } from './tasks/pushNotifications/sendNotifications';
import { refreshShareImagesTask } from './tasks/refreshShareImages';
import { resolveBalanceIssues } from './tasks/resolveBalanceIssues/resolveBalanceIssues';
import { resolveMissingPurchasesTask } from './tasks/resolveMissingPurchases';
import { syncExternalUserProfilesTask } from './tasks/syncExternalUserProfiles/syncExternalUserProfilesTask';
import { updateAllBuildersCardActivities } from './tasks/updateBuildersCardActivity';
import { updateTalentMoxieProfiles } from './tasks/updateTalentMoxieProfiles';

const app = new Koa();
const router = new Router();

// add a task endpoint which will be configured in cron.yml
function addTask(path: string, handler: (ctx: Koa.Context) => any) {
  const log = getLogger(`cron-${path.split('/').pop()}`);

  router.post(path, async (ctx) => {
    // just in case we need to disable cron in production
    if (process.env.DISABLE_CRON === 'true') {
      log.info(`Cron disabled, skipping`);
      return;
    }
    const timer = DateTime.now();
    log.info(`Task triggered`, { body: ctx.body, headers: ctx.headers });

    try {
      const result = await handler(ctx);

      log.info(`Completed task`, { durationMinutes: timer.diff(DateTime.now(), 'minutes') });

      ctx.body = result || { success: true };
    } catch (error) {
      log.error(`Error processing task`, {
        durationMinutes: timer.diff(DateTime.now(), 'minutes'),
        error
      });
      throw error;
    }
  });
}

addTask('/hello-world', (ctx) => {
  getLogger('hello-world').info('Hello World triggered', { body: ctx.body, headers: ctx.headers });
});

addTask('/process-builder-activity', processAllBuilderActivity);

addTask('/send-push-notifications', sendNotifications);

addTask('/process-gems-payout', processGemsPayout);

addTask('/process-nft-mints', processNftMints);

addTask('/sync-external-user-profiles', syncExternalUserProfilesTask);

addTask('/alert-low-wallet-gas-balance', alertLowWalletGasBalance);

addTask('/update-builder-card-activity', updateAllBuildersCardActivities);

addTask('/resync-nft-purchases', resolveMissingPurchasesTask);

addTask('/resolve-balance-issues', resolveBalanceIssues);

addTask('/refresh-nft-share-images', refreshShareImagesTask);

addTask('/update-talent-moxie-profiles', updateTalentMoxieProfiles);

addTask('/process-builder-onchain-activity', processBuilderOnchainActivity);

addTask('/process-onchain-gems-payout', processOnchainGemsPayout);

addTask('/process-dune-analytics', processDuneAnalytics);

// Standard health check used by Beanstalk
router.get('/api/health', middleware.healthCheck);

app.use(middleware.errorHandler).use(router.routes()).use(router.allowedMethods());

export default app;
