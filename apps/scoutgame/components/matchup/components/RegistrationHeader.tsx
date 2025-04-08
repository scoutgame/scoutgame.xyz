import { Box, Card, Link as MUILink, Stack, Typography } from '@mui/material';
import type { MatchupDetails } from '@packages/matchup/getMatchupDetails';
import { PointsIcon } from '@packages/scoutgame-ui/components/common/Icons';
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
                  Registration closed.{' '}
                  <MUILink component={Link} href='/matchup/register' sx={{ color: 'secondary.main' }}>
                    <em>Register for next week →</em>
                  </MUILink>
                </Typography>
              )}
            </Box>
            <Typography
              variant='body2'
              component='em'
              color='secondary.main'
              sx={{ textAlign: { xs: 'center', md: 'left' } }}
            >
              {registrationOpen && <ReferenceTime prefix='Begins in' unixTimestamp={startTime} />}
              {!registrationOpen && registered && <ReferenceTime prefix='Ends in' unixTimestamp={endTime} />}
            </Typography>
          </Stack>
        </Stack>
        <Box display='flex' flexDirection={{ xs: 'row', md: 'column' }} alignItems='center' gap={2}>
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
                  {matchupPool} <PointsIcon /> +{' '}
                </>
              ) : null}
              {opPrize} <Image width={14} height={14} src='/images/crypto/op.png' alt='' />
            </Typography>
          </Box>
          <Typography component='em' variant='body2' color='grey' noWrap>
            80% of registration fees
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
