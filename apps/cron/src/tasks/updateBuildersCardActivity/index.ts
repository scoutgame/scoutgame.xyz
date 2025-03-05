import { log } from '@charmverse/core/log';
import type Koa from 'koa';
import { DateTime } from 'luxon';

import { sendDeveloperRankChangeEmails } from '../../emails/sendDeveloperRankChangeEmails';

import { updateBuildersCardActivity } from './updateBuildersCardActivity';

export async function updateAllBuildersCardActivities(
  ctx: Koa.Context,
  { date = DateTime.now() }: { date?: DateTime } = {}
) {
  const weekday = date.weekday;
  log.info('Updating builder card activities');
  const buildersRanksRecord = await updateBuildersCardActivity(date);
  log.info(`Updated ${Object.keys(buildersRanksRecord).length} builder card activities`);

  // Make sure not to send emails on monday at the start of the week
  if (weekday !== 1) {
    const emailsSent = await sendDeveloperRankChangeEmails({
      buildersRanksRecord
    });
    log.info(`Sent ${emailsSent} developer rank change emails`);
  }
}
