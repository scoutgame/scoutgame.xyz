import { Box, Typography } from '@mui/material';
import type { MatchupDetails } from '@packages/matchup/getMatchupDetails';
import Image from 'next/image';

export function MatchUpRegistrationView() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1
      }}
    >
      <Typography variant='h5' color='secondary' align='center' sx={{ mt: 4, mb: 2 }}>
        Who will be this week's Champion Scout?
      </Typography>
      <Box mt={2}>
        <Image src='/images/matchup/scout_king.svg' alt='' width={280} height={280} style={{ maxWidth: '100%' }} />
      </Box>
    </Box>
  );
}
