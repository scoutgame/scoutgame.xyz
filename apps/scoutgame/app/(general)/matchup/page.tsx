import { Box, Grid2 as Grid, Card, Typography } from '@mui/material';
import { PageContainer } from '@packages/scoutgame-ui/components/common/PageContainer';
import { DateTime } from 'luxon';

export default function MatchupPage() {
  const currentWeek = DateTime.now().weekNumber;

  return (
    <PageContainer>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <Typography variant='h4' gutterBottom>
              Week {currentWeek} Match Up!
            </Typography>
            <Typography variant='body1'>
              Choose your team and face-off with your fellow Scouts! Who will be this week's Champion Scout?
            </Typography>
          </Card>
        </Grid>
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
