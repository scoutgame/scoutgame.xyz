import { Box, Card, Link as MUILink, Stack, Typography } from '@mui/material';
import type { MatchupDetails } from '@packages/matchup/getMatchupDetails';
import Image from 'next/image';
import Link from 'next/link';

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
      <Box
        display='flex'
        flexDirection={{ xs: 'column', md: 'row' }}
        alignItems='center'
        justifyContent='space-between'
        gap={{ xs: 2, md: 0 }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems='center' gap={2}>
          <Box mr={2} display={{ xs: 'none', md: 'block' }}>
            <Image src='/images/matchup/vs_icon.svg' alt='' width={80} height={80} />
          </Box>
          <Stack gap={1}>
            <Box alignItems='center' gap={1} display='flex'>
              <Box display={{ xs: 'block', md: 'none' }}>
                <Image src='/images/matchup/vs_icon.svg' alt='' width={80} height={80} />
              </Box>
              <Typography variant='h4' color='secondary' fontWeight={400}>
                Week {weekNumber} Match Up!
              </Typography>
            </Box>
            <Box>
              {registrationOpen || registered ? (
                <RegistrationButton registered={registered} week={week} />
              ) : (
                <Typography variant='body2' color='secondary' component='span'>
                  Registration closed.
                </Typography>
              )}
            </Box>
            <Typography
              variant='body2'
              component='em'
              color='secondary.main'
              sx={{ textAlign: { xs: 'center', md: 'left' } }}
            >
              {registrationOpen && <ReferenceTime prefix='Begins in' timestamp={startTime} />}
              {!registrationOpen && registered && <ReferenceTime prefix='Ends in' timestamp={endTime} />}
            </Typography>
          </Stack>
        </Stack>
        <Box textAlign='center'>
          <Box display='flex' flexDirection={{ xs: 'row', md: 'column' }} alignItems='center' gap={2} mb={1}>
            <Typography
              variant='h6'
              color='secondary'
              sx={{ fontSize: { xs: 14, md: 20 }, display: 'flex', alignItems: 'center', gap: 0.5 }}
              noWrap
            >
              <Image src='/images/matchup/howtoplay_trophy.svg' alt='' width={20} height={20} /> Prize Pool
            </Typography>
            <Box>
              <Typography component='span' sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} noWrap>
                {matchupPool ? (
                  <>
                    {matchupPool} <Image width={14} height={14} src='/images/dev-token-logo.png' alt='DEV token' />{' '}
                    +{' '}
                  </>
                ) : null}
                {opPrize} <Image width={14} height={14} src='/images/crypto/op.png' alt='' />
              </Typography>
            </Box>
          </Box>
          <Typography component='em' variant='body2' color='grey' noWrap>
            80% of registration fees
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
