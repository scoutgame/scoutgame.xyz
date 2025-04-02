import { Box, Card, Typography } from '@mui/material';
import type { MyMatchup } from '@packages/matchup/getMyMatchup';
import type { MatchupDetails } from '@packages/matchup/getNextMatchup';

export function MatchUpSubmittedView({ myMatchup, matchup }: { myMatchup: MyMatchup; matchup: MatchupDetails }) {
  return (
    <Box>
      <Typography variant='h5' color='secondary'>
        Submitted
      </Typography>
    </Box>
  );
}
