import { Box, Card, Stack, Typography } from '@mui/material';
import type { MatchupDetails } from '@packages/matchup/getMatchupDetails';
import { PointsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import Image from 'next/image';

import { ReferenceTime } from 'components/common/ReferenceTime';

import { RegistrationButton } from './RegistrationButton';

export function RegistrationHeader({
  matchup: { week, weekNumber, matchupPool, opPrize, endTime, startTime },
  registered,
  registrationOpen
}: {
  matchup: MatchupDetails;
  registered: boolean;
  registrationOpen?: boolean;
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
              {registrationOpen || registered ? (
                <RegistrationButton registered={registered} week={week} />
              ) : (
                <Typography variant='body2' color='secondary' component='span'>
                  Registration closed. Next match in 24 hours
                </Typography>
              )}
            </Box>
            <Typography variant='body2' component='em' color='secondary'>
              {registrationOpen && <ReferenceTime prefix='Begins in' unixTimestamp={startTime} />}
              {!registrationOpen && registered && <ReferenceTime prefix='Ends in' unixTimestamp={endTime} />}
            </Typography>
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
