import { getSession } from '@packages/nextjs/session/getSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getDailyClaims } from '@packages/scoutgame/claims/getDailyClaims';
import { getQuests } from '@packages/scoutgame/quests/getQuests';
import { getTop5ConnectorsToday } from '@packages/scoutgame/topConnector/getTopConnectors';
import { getFriends } from '@packages/users/getFriends';

import { QuestsPage } from './QuestsPage';

export default async function Quests() {
  const session = await getSession();
  const scoutId = session.scoutId;

  if (!scoutId) {
    return null;
  }

  const allPromises = [
    getFriends(scoutId),
    getDailyClaims(scoutId),
    getQuests(scoutId),
    getTop5ConnectorsToday(scoutId)
  ] as const;
  const [error, data] = await safeAwaitSSRData(Promise.all(allPromises));

  if (error) {
    return null;
  }

  const [friends, dailyClaims, quests, topConnectors] = data;

  return <QuestsPage dailyClaims={dailyClaims} quests={quests} friends={friends} topConnectors={topConnectors} />;
}
