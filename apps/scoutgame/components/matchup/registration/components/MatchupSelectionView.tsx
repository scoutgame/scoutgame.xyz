import { Card, Typography } from '@mui/material';
import type { MyMatchup } from '@packages/matchup/getMyMatchup';
import type { MatchupDetails } from '@packages/matchup/getNextMatchup';

export function MatchUpSelectionView({ myMatchup, matchup }: { myMatchup: MyMatchup; matchup: MatchupDetails }) {
  return (
    <>
      <Card
        sx={{
          borderColor: 'secondary.main',
          p: 2
        }}
      >
        <Typography variant='h4' color='secondary'>
          Week {matchup.weekNumber} Match Up
        </Typography>
        <Typography variant='body1'>
          Choose your team and face-off with your fellow Scouts! Who will be this week's Champion Scout?
        </Typography>
      </Card>
      <Typography variant='h5' color='secondary'>
        Selection
      </Typography>
    </>
  );
}
