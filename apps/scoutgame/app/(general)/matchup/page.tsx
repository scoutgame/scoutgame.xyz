import { getCurrentWeek } from '@packages/dates/utils';
import { getMatchupByScout } from '@packages/matchup/getMatchupByScout';
import { getNextMatchup } from '@packages/matchup/getNextMatchup';
import { getCachedUserFromSession as getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { DateTime } from 'luxon';

import { MatchupLeaderboardPage } from 'components/matchup/MatchupLeaderboardPage';
import { MatchupRegistrationPage } from 'components/matchup/registration/MatchupRegistrationPage';

export default async function MatchupPageWrapper() {
  const [, user] = await safeAwaitSSRData(getUserFromSession());
  const currentWeek = getCurrentWeek();
  const nextMatchup = await getNextMatchup();
  const [myActiveMatchup, myNextMatchup] = await safeAwaitSSRData(
    Promise.all([
      getMatchupByScout({ scoutId: user?.id, week: currentWeek }),
      getMatchupByScout({ scoutId: user?.id, week: nextMatchup.week })
    ])
  );

  // on Monday, the 'next matchup' is the current week
  if (currentWeek === nextMatchup.week) {
    return <MatchupRegistrationPage matchup={myNextMatchup} weekNumber={nextMatchup.weekNumber} />;
  }
  return <MatchupLeaderboardPage matchup={myActiveMatchup} weekNumber={currentWeek} />;
}
