import { getCurrentWeek } from '@packages/dates/utils';
import { getMyMatchup } from '@packages/matchup/getMyMatchup';
import { getNextMatchup } from '@packages/matchup/getNextMatchup';
import { getCachedUserFromSession as getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { DateTime } from 'luxon';

// import { MatchupProvider } from 'components/matchup/hooks/useMatchup';
import { MatchupLeaderboardPage } from 'components/matchup/MatchupLeaderboardPage';
import { MatchupRegistrationPage } from 'components/matchup/registration/MatchupRegistrationPage';

export default async function MatchupPageWrapper() {
  const [, user] = await safeAwaitSSRData(getUserFromSession());
  const currentWeek = getCurrentWeek();
  const nextMatchup = await getNextMatchup();
  const [, data] = await safeAwaitSSRData(
    Promise.all([
      getMyMatchup({ scoutId: user?.id, week: currentWeek }),
      getMyMatchup({ scoutId: user?.id, week: nextMatchup.week })
    ])
  );

  const [myActiveMatchup, myNextMatchup] = data ?? [];

  return (
    // <MatchupProvider myNextMatchup={myNextMatchup}>
    // on Monday, the 'next matchup' is the current week
    currentWeek === nextMatchup.week ? (
      <MatchupRegistrationPage myMatchup={myNextMatchup} matchup={nextMatchup} />
    ) : (
      <MatchupLeaderboardPage matchup={myActiveMatchup} />
    )
    // </MatchupProvider>
  );
}
