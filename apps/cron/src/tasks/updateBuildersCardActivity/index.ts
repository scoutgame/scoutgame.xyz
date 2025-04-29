import { log } from '@charmverse/core/log';
import type Koa from 'koa';
import { DateTime } from 'luxon';
import { sendDeveloperRankChangeNotifications } from 'src/notifications/sendDeveloperRankChangeNotifications';

import { updateBuildersCardActivity } from './updateBuildersCardActivity';

export async function updateAllBuildersCardActivities(
  ctx: Koa.Context,
  { date = DateTime.now() }: { date?: DateTime } = {}
) {
  const weekday = date.weekday;
  log.info('Updating dev card activities');
  const buildersRanksRecord = await updateBuildersCardActivity(date);
  log.info(`Updated ${Object.keys(buildersRanksRecord).length} dev card activities`);

  // Make sure not to send emails on monday at the start of the week
  if (weekday !== 1) {
    const notificationsSent = await sendDeveloperRankChangeNotifications({
      buildersRanksRecord
    });
    log.info(`Sent ${notificationsSent} developer rank change notifications`);
  }
}
