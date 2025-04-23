import { Box, Grid } from '@mui/material';
import type { MatchupDetails } from '@packages/matchup/getMatchupDetails';
import type { MyMatchup } from '@packages/matchup/getMyMatchup';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import { PageContainer } from '@packages/scoutgame-ui/components/common/PageContainer';
import { Suspense } from 'react';

import { HowToPlayCard } from '../components/HowToPlayCard';
import { RegistrationHeader } from '../components/RegistrationHeader';

import { MatchUpRegistrationView } from './components/MatchupRegistration/MatchupRegistrationView';
import { MatchUpSelectionView } from './components/MatchupSelection/MatchupSelectionView';
import { MatchUpSubmittedView } from './components/MatchupSubmitted/MatchupSubmittedView';
import { RegistrationSidebar } from './components/RegistrationSidebar/RegistrationSidebar';

export function MatchupRegistrationPage({
  myMatchup,
  matchup
}: {
  myMatchup?: MyMatchup | null;
  matchup: MatchupDetails;
}) {
  return (
    <PageContainer>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <RegistrationHeader matchup={matchup} registered={!!myMatchup} registrationOpen />
          <Hidden mdUp>
            <HowToPlayCard registrationOpen />
          </Hidden>
          {myMatchup?.submittedAt ? (
            <MatchUpSubmittedView myMatchup={myMatchup} />
          ) : myMatchup ? (
            <MatchUpSelectionView myMatchup={myMatchup} />
          ) : (
            <MatchUpRegistrationView />
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Hidden mdDown>
            <HowToPlayCard registrationOpen />
          </Hidden>
          <Suspense fallback={<div>Loading...</div>}>
            <RegistrationSidebar week={matchup.week} weekNumber={matchup.weekNumber} />
          </Suspense>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
