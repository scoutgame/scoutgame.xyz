import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Button, Paper, Card, CardActionArea, Typography } from '@mui/material';
import { getNextMatchup } from '@packages/matchup/getNextMatchup';
import { DateTime } from 'luxon';
import Link from 'next/link';

export async function WeeklyMatchupCallout() {
  const { week, weekNumber, matchupPool, opPrize } = await getNextMatchup();

  return (
    <Card
      sx={{
        mb: 2,
        mt: {
          xs: 0,
          md: 2
        }
      }}
    >
      <CardActionArea href='/matchup' sx={{ p: 2 }}>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Box>
            <Typography variant='h6' gutterBottom color='secondary'>
              Week {weekNumber} Match Up
            </Typography>
            <Typography variant='body1' gutterBottom>
              Choose your team and face-off with your fellow Scouts! Who will be this week's Champion Scout?
            </Typography>
          </Box>
          <ChevronRightIcon color='secondary' fontSize='large' />
        </Box>
      </CardActionArea>
    </Card>
  );
}
