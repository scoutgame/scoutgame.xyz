import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { createTopConnectorEvent } from '@packages/scoutgame/topConnector/createTopConnectorEvent';
import { getTopConnectorToday } from '@packages/scoutgame/topConnector/getTopConnectors';
import { DateTime } from 'luxon';

export async function topConnectorToday() {
  const topConnector = await getTopConnectorToday();

  if (!topConnector?.builderId) {
    log.warn('No top connector found as top connector today', { topConnector });
    return;
  }

  const existingTopConnecterToday = await prisma.builderEvent.findFirst({
    where: {
      builderId: topConnector.builderId,
      createdAt: {
        gte: DateTime.utc().minus({ day: 1 }).toJSDate() // Assuming the hour is 00:00:00 UTC time and we need the previous day
      },
      type: 'top_connector'
    }
  });

  if (existingTopConnecterToday) {
    log.warn('Top connector already exists for today', { topConnector, existingTopConnecterToday });
    return;
  }

  await createTopConnectorEvent({ builderId: topConnector.builderId, referralPoints: topConnector.referralPoints });
}
