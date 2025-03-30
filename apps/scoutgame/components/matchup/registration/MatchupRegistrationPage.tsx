import { Box, Grid2 as Grid, Card, Typography, CardActionArea } from '@mui/material';
import { getNextMatchup } from '@packages/matchup/getNextMatchup';
import { PageContainer } from '@packages/scoutgame-ui/components/common/PageContainer';
import { WeeklyMatchupCalloutTimer } from '@packages/scoutgame-ui/components/scout/components/WeeklyMatchupCalloutTimer';
import Image from 'next/image';

import { MatchUpRegistrationView } from './components/MatchupRegistrationView';
import { MatchUpSelectionView } from './components/MatchupSelectionView';
import { MatchUpSubmittedView } from './components/MatchupSubmittedView';

async function WeeklyMatchupCallout() {
  const { weekNumber, matchupPool, opPrize, startOfMatchup } = await getNextMatchup();

  return (
    <Card
      sx={{
        borderColor: 'secondary.main',
        mb: 2,
        mt: {
          xs: 0,
          md: 2
        }
      }}
    >
      <CardActionArea href='/matchup' sx={{ p: 2 }}>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Box mr={{ xs: 0, md: 2 }}>
            <Image src='/images/matchup/vs_icon.svg' alt='' width={80} height={80} />
          </Box>
          <Box display='flex' flexDirection='column' gap={1}>
            <Typography variant='h6' color='secondary'>
              Week {weekNumber} Match Up
            </Typography>
            <Box>
              <Typography color='secondary' component='span'>
                🏆 Prize Pool:
              </Typography>{' '}
              <Typography component='span'>
                {matchupPool ? `${matchupPool * 40} DEV` : ''}
                {opPrize} <Image width={14} height={14} src='/images/crypto/op.png' alt='' />
              </Typography>
            </Box>
            <Typography variant='body2'>
              Choose your team and face-off with your fellow Scouts! Who will be this week's Champion Scout?
            </Typography>
            <WeeklyMatchupCalloutTimer upcomingTime={startOfMatchup} />
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
}

export function MatchupRegistrationPage({
  matchup,
  weekNumber
}: {
  matchup?: { submittedAt?: Date };
  weekNumber: number;
}) {
  return (
    <PageContainer>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          {matchup?.submittedAt ? (
            <MatchUpSubmittedView weekNumber={weekNumber} />
          ) : matchup ? (
            <MatchUpSelectionView weekNumber={weekNumber} />
          ) : (
            <MatchUpRegistrationView weekNumber={weekNumber} />
          )}
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
