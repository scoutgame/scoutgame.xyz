import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Paper, Card, CardActionArea, Typography } from '@mui/material';
import { getNextMatchup } from '@packages/matchup/getNextMatchup';
import Image from 'next/image';

import { WeeklyMatchupCalloutTimer } from './WeeklyMatchupCalloutTimer';

export async function WeeklyMatchupCallout() {
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
                {matchupPool ? `${matchupPool} DEV + ` : ''}
                {opPrize} <Image width={14} height={14} src='/images/crypto/op.png' alt='' />
              </Typography>
            </Box>
            <Typography variant='body2'>
              Choose your team and face-off with your fellow Scouts! Who will be this week's Champion Scout?
            </Typography>
            <WeeklyMatchupCalloutTimer upcomingTime={startOfMatchup} />
          </Box>
          <ChevronRightIcon fontSize='large' />
        </Box>
      </CardActionArea>
    </Card>
  );
}
