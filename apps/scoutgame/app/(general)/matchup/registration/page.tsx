import { getCurrentWeek } from '@packages/dates/utils';
import { getMyMatchup } from '@packages/matchup/getMyMatchup';
import { getNextMatchup } from '@packages/matchup/getNextMatchup';
import { getCachedUserFromSession as getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { DateTime } from 'luxon';

import { MatchupRegistrationPage } from 'components/matchup/registration/MatchupRegistrationPage';

export default async function MatchupPageWrapper() {
  const [, user] = await safeAwaitSSRData(getUserFromSession());
  const nextMatchup = await getNextMatchup();
  const [, myNextMatchup] = await safeAwaitSSRData(getMyMatchup({ scoutId: user?.id, week: nextMatchup.week }));

  return <MatchupRegistrationPage myMatchup={myNextMatchup} matchup={nextMatchup} />;
}
