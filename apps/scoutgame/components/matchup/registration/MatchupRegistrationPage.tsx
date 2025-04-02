import { Box, Grid2 as Grid } from '@mui/material';
import type { MyMatchup } from '@packages/matchup/getMyMatchup';
import type { MatchupDetails } from '@packages/matchup/getNextMatchup';
import { PageContainer } from '@packages/scoutgame-ui/components/common/PageContainer';
import { Suspense } from 'react';

import { HowToPlayCard } from './components/HowToPlayCard';
import { MatchUpRegistrationView } from './components/MatchupRegistration/MatchupRegistrationView';
import { MatchUpSelectionView } from './components/MatchupSelection/MatchupSelectionView';
import { MatchUpSubmittedView } from './components/MatchupSubmitted/MatchupSubmittedView';
import { RegistrationHeader } from './components/RegistrationHeader';
import { SidebarEntries } from './components/SidebarEntries';

export function MatchupRegistrationPage({
  myMatchup,
  matchup
}: {
  myMatchup?: MyMatchup | null;
  matchup: MatchupDetails;
}) {
  return (
    <PageContainer>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }} mb={10}>
          <RegistrationHeader matchup={matchup} registered={!!myMatchup} />
          {myMatchup?.submittedAt ? (
            <MatchUpSubmittedView myMatchup={myMatchup} matchup={matchup} />
          ) : myMatchup ? (
            <MatchUpSelectionView myMatchup={myMatchup} />
          ) : (
            <MatchUpRegistrationView matchup={matchup} />
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <HowToPlayCard />
          <Suspense fallback={<div>Loading...</div>}>
            <SidebarEntries week={matchup.week} weekNumber={matchup.weekNumber} />
          </Suspense>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
