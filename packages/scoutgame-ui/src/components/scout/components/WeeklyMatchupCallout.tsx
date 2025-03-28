import { Box, Button, Typography } from '@mui/material';
import { DateTime } from 'luxon';
import Link from 'next/link';

export function WeeklyMatchupCallout() {
  const currentWeek = DateTime.now().weekNumber;

  return (
    <Box
      sx={{
        background: 'linear-gradient(88.35deg, #96CDFF 0%, #A06CD5 29.5%, #96CDFF 75.47%, #A06CD5 100%)',
        borderRadius: 1,
        p: 3,
        mb: 3,
        color: 'white'
      }}
    >
      <Typography variant='h6' gutterBottom>
        Week {currentWeek} Match Up
      </Typography>
      <Typography variant='body1' gutterBottom>
        Choose your team and face-off with your fellow Scouts! Who will be this week's Champion Scout?
      </Typography>
      <Button
        component={Link}
        href='/matchup'
        variant='contained'
        sx={{
          mt: 2,
          backgroundColor: 'white',
          color: 'primary.main',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }
        }}
      >
        Join Match Up
      </Button>
    </Box>
  );
}
