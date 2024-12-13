import { getDailyClaims } from '@packages/scoutgame/claims/getDailyClaims';
import { getQuests } from '@packages/scoutgame/quests/getQuests';
import { getSession } from '@packages/scoutgame/session/getSession';
import { getFriends } from '@packages/scoutgame/users/getFriends';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';
import { QuestsPage } from '@packages/scoutgame-ui/components/quests/QuestsPage';

export default async function Quests() {
  const session = await getSession();
  const scoutId = session.scoutId;

  if (!scoutId) {
    return null;
  }

  const allPromises = [getFriends(scoutId), getDailyClaims(scoutId), getQuests(scoutId)] as const;
  const [error, data] = await safeAwaitSSRData(Promise.all(allPromises));

  if (error) {
    return null;
  }

  const [friends, dailyClaims, quests] = data;

  return <QuestsPage dailyClaims={dailyClaims} quests={quests} friends={friends} />;
}
