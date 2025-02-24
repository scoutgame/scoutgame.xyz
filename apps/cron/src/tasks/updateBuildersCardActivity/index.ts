import { log } from '@charmverse/core/log';
import type Koa from 'koa';
import { DateTime } from 'luxon';

import { updateBuildersCardActivity } from './updateBuildersCardActivity';

export async function updateAllBuildersCardActivities(
  ctx: Koa.Context,
  { date = DateTime.now() }: { date?: DateTime } = {}
) {
  log.info('Updating builder card activities');
  const updatedBuilders = await updateBuildersCardActivity(date);
  log.info(`Updated ${updatedBuilders} builder card activities`);
}
