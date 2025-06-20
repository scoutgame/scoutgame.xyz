import { log } from '@charmverse/core/log';
import { enableMatchupsFeatureFlag } from '@packages/matchup/config';
import { getCurrentMatchupDetails } from '@packages/matchup/getMatchupDetails';
import { getMyMatchup } from '@packages/matchup/getMyMatchup';
import { getCachedUserFromSession as getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { redirect } from 'next/navigation';

// import { MatchupProvider } from 'components/matchup/hooks/useMatchup';
import { MatchupLeaderboardPage } from 'components/matchup/leaderboard/MatchupLeaderboardPage';
import { MatchupRegistrationPage } from 'components/matchup/register/MatchupRegistrationPage';

export default async function MatchupPageWrapper() {
  const [, user] = await safeAwaitSSRData(getUserFromSession());
  const [matchupError, matchupDetails] = await safeAwaitSSRData(getCurrentMatchupDetails());
  if (matchupError) {
    return <div>Error: {matchupError.message}</div>;
  }
  const [, myMatchup] = await safeAwaitSSRData(getMyMatchup({ scoutId: user?.id, week: matchupDetails.week }));

  if (!enableMatchupsFeatureFlag()) {
    log.info('Matchup is disabled, redirecting to scout page', { week: matchupDetails.week });
    redirect('/scout');
  }

  if (matchupDetails.registrationOpen) {
    return <MatchupRegistrationPage matchup={matchupDetails} myMatchup={myMatchup} />;
  }

  return (
    <MatchupLeaderboardPage matchup={matchupDetails} scoutId={user?.id} hasRegistered={!!myMatchup?.submittedAt} />
  );
}
