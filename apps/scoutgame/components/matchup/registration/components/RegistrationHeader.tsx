import { Box, Card, Stack, Typography } from '@mui/material';
import type { MatchupDetails } from '@packages/matchup/getNextMatchup';
import { PointsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import Image from 'next/image';

import { WeeklyMatchupCalloutTimer } from 'components/scout/components/WeeklyMatchupCalloutTimer';

import { RegistrationButton } from './RegistrationButton';

export function RegistrationHeader({
  matchup: { week, weekNumber, matchupPool, opPrize, startOfMatchup },
  registered
}: {
  matchup: MatchupDetails;
  registered: boolean;
}) {
  return (
    <Card
      sx={{
        borderColor: 'secondary.main',
        p: 2,
        mb: 2
      }}
    >
      <Box display='flex' alignItems='center' justifyContent='space-between'>
        <Stack direction='row' alignItems='center' gap={2}>
          <Box mr={{ xs: 0, md: 2 }}>
            <Image src='/images/matchup/vs_icon.svg' alt='' width={80} height={80} />
          </Box>
          <Stack gap={1}>
            <Typography variant='h4' color='secondary' fontWeight={400}>
              Week {weekNumber} Match Up!
            </Typography>
            <Box>
              <RegistrationButton registered={registered} week={week} />
            </Box>
            <WeeklyMatchupCalloutTimer upcomingTime={startOfMatchup} />
          </Stack>
        </Stack>
        <Box display='flex' flexDirection='column' alignItems='center' gap={1}>
          <Typography variant='h6' color='secondary'>
            Prize Pool
          </Typography>
          <Box>
            <Typography component='span' sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {matchupPool ? (
                <>
                  {matchupPool} <PointsIcon /> +{' '}
                </>
              ) : null}
              {opPrize} <Image width={14} height={14} src='/images/crypto/op.png' alt='' />
            </Typography>
          </Box>
          <Typography component='em' variant='body2' color='grey'>
            *80% of registration fees
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
