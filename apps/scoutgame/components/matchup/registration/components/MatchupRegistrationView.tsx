import { Box, Button, Card, Stack, Typography } from '@mui/material';
import type { MatchupDetails } from '@packages/matchup/getNextMatchup';
import { PointsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import { WeeklyMatchupCalloutTimer } from '@packages/scoutgame-ui/components/scout/components/WeeklyMatchupCalloutTimer';
import Image from 'next/image';

export function MatchUpRegistrationView({
  matchup: { weekNumber, matchupPool, opPrize, startOfMatchup }
}: {
  matchup: MatchupDetails;
}) {
  return (
    <>
      <Card
        sx={{
          borderColor: 'secondary.main',
          p: 2
        }}
      >
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Box mr={{ xs: 0, md: 2 }}>
            <Image src='/images/matchup/vs_icon.svg' alt='' width={80} height={80} />
          </Box>
          <Stack gap={1}>
            <Typography variant='h4' color='secondary' fontWeight={400}>
              Week {weekNumber} Match Up!
            </Typography>
            <Box>
              <Button variant='contained' color='secondary' endIcon={<PointsIcon color='inherit' />}>
                Register 50
              </Button>
            </Box>
            <WeeklyMatchupCalloutTimer upcomingTime={startOfMatchup} />
          </Stack>
          <Box display='flex' flexDirection='column' alignItems='center' gap={1}>
            <Typography variant='h6' color='secondary'>
              Prize Pool
            </Typography>
            <Box>
              <Typography component='span'>
                {matchupPool ? `${matchupPool * 40} DEV` : ''}
                {opPrize} <Image width={14} height={14} src='/images/crypto/op.png' alt='' />
              </Typography>
            </Box>
            <Typography component='em' variant='body2' color='grey'>
              *80% of registration fees
            </Typography>
          </Box>
        </Box>
      </Card>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          mt: 2
        }}
      >
        <Typography variant='h5' color='secondary' align='center' sx={{ mt: 4, mb: 2 }}>
          Who will be this week's Champion Scout?
        </Typography>
        <Box mt={2}>
          <Image src='/images/matchup/scout_king.svg' alt='' width={280} height={280} style={{ maxWidth: '100%' }} />
        </Box>
      </Box>
    </>
  );
}
