import { log } from '@charmverse/core/log';
import type { TopConnector } from '@packages/scoutgame/topConnector/getTopConnectors';
import { getTopConnectorOfTheDay } from '@packages/scoutgame/topConnector/getTopConnectors';
import { DateTime } from 'luxon';

export async function getScoutsForTopConnectorPartner({ days }: { days: number }) {
  const topConnectors: (TopConnector & { date: string })[] = [];

  for (let day = 1; day <= days; day++) {
    const date = DateTime.utc().minus({ days: day });
    const topConnector = await getTopConnectorOfTheDay({ date });

    if (topConnector) {
      topConnectors.push({ ...topConnector, date: date.toJSDate().toDateString() });
    } else {
      log.info('No top connector found for the day', { day, date });
    }
  }

  return topConnectors.map((connector) => ({
    'User Name': connector.displayName,
    'Profile Link': `https://scoutgame.xyz/u/${connector.path}`,
    address: connector.address,
    Date: connector.date,
    Points: connector.referralPoints
  }));
}
