import { Card, Typography } from '@mui/material';

export function MatchUpRegistrationView({ weekNumber }: { weekNumber: number }) {
  return (
    <>
      <Card
        sx={{
          borderColor: 'secondary.main',
          p: 2
        }}
      >
        <Typography variant='h4' color='secondary'>
          Week {weekNumber} Match Up
        </Typography>
        <Typography variant='body1'>
          Choose your team and face-off with your fellow Scouts! Who will be this week's Champion Scout?
        </Typography>
      </Card>
      <Typography variant='h5' color='secondary'>
        Registration
      </Typography>
    </>
  );
}
