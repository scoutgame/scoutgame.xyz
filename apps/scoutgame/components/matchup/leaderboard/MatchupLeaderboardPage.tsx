import { Box, Grid2 as Grid, Card, Typography, CardActionArea } from '@mui/material';
import type { MatchupDetails } from '@packages/matchup/getMatchupDetails';
import { PageContainer } from '@packages/scoutgame-ui/components/common/PageContainer';

import { HowToPlayCard } from '../components/HowToPlayCard';
import { RegistrationHeader } from '../components/RegistrationHeader';

export function MatchupLeaderboardPage({
  matchup,
  hasRegistered
}: {
  matchup: MatchupDetails;
  hasRegistered: boolean;
}) {
  return (
    <PageContainer>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <RegistrationHeader matchup={matchup} registered={hasRegistered} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <HowToPlayCard registrationOpen={false} />
        </Grid>
      </Grid>
    </PageContainer>
  );
}
