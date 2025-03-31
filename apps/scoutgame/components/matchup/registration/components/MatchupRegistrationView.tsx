import { log } from '@charmverse/core/log';
import { Box, Button, Card, Stack, Typography } from '@mui/material';
import type { MatchupDetails } from '@packages/matchup/getNextMatchup';
import { registerForMatchupAction } from '@packages/matchup/registerForMatchupAction';
import { revalidatePathAction } from '@packages/nextjs/actions/revalidatePathAction';
import { PointsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import { WeeklyMatchupCalloutTimer } from '@packages/scoutgame-ui/components/scout/components/WeeklyMatchupCalloutTimer';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

export function MatchUpRegistrationView({ matchup }: { matchup: MatchupDetails }) {
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
