import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getDailyClaims } from '@packages/scoutgame/claims/getDailyClaims';
import { getQuests } from '@packages/scoutgame/quests/getQuests';
import { QuestsPage } from '@packages/scoutgame-ui/components/quests/QuestsPage';
import { getFriends } from '@packages/users/getFriends';

export default async function Quests() {
  const user = await getUserFromSession();
  if (!user) {
    return null;
  }
  const [, friends = []] = await safeAwaitSSRData(getFriends(user.id));
  const [, dailyClaims = []] = await safeAwaitSSRData(getDailyClaims(user.id));
  const [, quests = []] = await safeAwaitSSRData(getQuests(user.id));

  return <QuestsPage dailyClaims={dailyClaims} quests={quests} friends={friends} />;
}
