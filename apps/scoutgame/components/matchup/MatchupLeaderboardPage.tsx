import { Box, Grid2 as Grid, Card, Typography, CardActionArea } from '@mui/material';
import type { MatchupDetails } from '@packages/matchup/getNextMatchup';
import { PageContainer } from '@packages/scoutgame-ui/components/common/PageContainer';
import Image from 'next/image';

export function MatchupLeaderboardPage({ matchup }: { matchup: MatchupDetails }) {
  return (
    <PageContainer>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>Leaderboard</Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <Typography variant='h5' gutterBottom>
              Play Weekly Match Up!
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant='subtitle1' gutterBottom>
                Registered Scouts:
              </Typography>
              {/* TODO: Add registered scouts table */}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
