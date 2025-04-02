import { Grid2 as Grid } from '@mui/material';
import type { MatchupDetails } from '@packages/matchup/getMatchupDetails';
import { PageContainer } from '@packages/scoutgame-ui/components/common/PageContainer';
import { Suspense } from 'react';

import { HowToPlayCard } from '../components/HowToPlayCard';
import { RegistrationHeader } from '../components/RegistrationHeader';

import { MatchupLeaderboardTable } from './components/MatchupLeaderboardTable';

export function MatchupLeaderboardPage({
  matchup,
  hasRegistered
}: {
  matchup: MatchupDetails;
  hasRegistered: boolean;
}) {
  return (
    <PageContainer>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <RegistrationHeader matchup={matchup} registered={hasRegistered} />
          <Suspense fallback={<div>Loading...</div>}>
            <MatchupLeaderboardTable week={matchup.week} />
          </Suspense>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <HowToPlayCard registrationOpen={false} />
        </Grid>
      </Grid>
    </PageContainer>
  );
}
