import { getCurrentWeek } from '@packages/dates/utils';
import { getMatchupByScout } from '@packages/matchup/getMatchupByScout';
import { getNextMatchup } from '@packages/matchup/getNextMatchup';
import { getCachedUserFromSession as getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { DateTime } from 'luxon';

import { MatchupLeaderboardPage } from 'components/matchup/leaderboard/MatchupLeaderboardPage';
import { MatchupRegistrationPage } from 'components/matchup/registration/MatchupRegistrationPage';

export default async function MatchupPageWrapper() {
  const [, user] = await safeAwaitSSRData(getUserFromSession());
  const nextMatchup = await getNextMatchup();
  const myNextMatchup = await safeAwaitSSRData(getMatchupByScout({ scoutId: user?.id, week: nextMatchup.week }));

  return <MatchupRegistrationPage matchup={myNextMatchup} weekNumber={nextMatchup.weekNumber} />;
}
