import { getCurrentWeek, getNextWeek } from '@packages/dates/utils';
import { REGISTRATION_DAY_OF_WEEK } from '@packages/matchup/config';
import { getMatchupDetails } from '@packages/matchup/getMatchupDetails';
import { getMyMatchup } from '@packages/matchup/getMyMatchup';
import { getCachedUserFromSession as getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { DateTime } from 'luxon';

import { MatchupRegistrationPage } from 'components/matchup/register/MatchupRegistrationPage';

export default async function MatchupPageWrapper() {
  const [, user] = await safeAwaitSSRData(getUserFromSession());
  const isItRegistrationDay = DateTime.now().weekday === REGISTRATION_DAY_OF_WEEK;
  const matchupWeek = isItRegistrationDay ? getCurrentWeek() : getNextWeek(getCurrentWeek());
  // get the next matchup
  const [matchupError, nextMatchup] = await safeAwaitSSRData(getMatchupDetails(matchupWeek));
  if (matchupError) {
    return <div>Error: {matchupError.message}</div>;
  }
  const [, myNextMatchup] = await safeAwaitSSRData(getMyMatchup({ scoutId: user?.id, week: matchupWeek }));
  return <MatchupRegistrationPage myMatchup={myNextMatchup} matchup={nextMatchup} />;
}
