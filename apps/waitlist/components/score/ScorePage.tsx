import 'server-only';

import type { ConnectWaitlistSlot } from '@charmverse/core/prisma-client';
import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { Box, Button, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import { FadeIn } from 'components/common/Animations/FadeIn';
import { LearnMore } from 'components/common/LearnMore';

import ProgressBar from './ScoresProgressBar';
import { ScoreTier } from './ScoreTier';

/*    <Typography variant='h3'>Score Page</Typography>

      <Typography variant='body1'>Tier: {getTier(waitlistSlot?.percentile as number)}</Typography>

      <Typography variant='body1'>Percentile: {waitlistSlot?.percentile}</Typography>

      <Typography variant='body1'>Clicks: {waitlistSlot?.clicks}</Typography> */

const milestones = [
  { percent: 30, icon: '🔥' },
  { percent: 60, icon: '🌟' },
  { percent: 80, icon: '💎' },
  { percent: 95, icon: '🏆' }
];

export function ScorePage({ waitlistSlot }: { waitlistSlot: ConnectWaitlistSlot & { clicks: number } }) {
  return (
    <PageWrapper py={0} my={0}>
      <Box
        display='flex'
        flexDirection='column'
        alignItems='center'
        maxWidth='100vw'
        border='none'
        borderRadius='0'
        textAlign='center'
        bgcolor='transparent'
        sx={{
          display: 'flex',
          flexDirection: 'column',
          my: 0,
          justifyContent: 'space-evenly',
          alignItems: 'center',
          minHeight: 'calc(100svh - 100px)'
        }}
      >
        <Image
          src='/images/scout-game-logo.png'
          width={400}
          height={200}
          sizes='100vw'
          style={{
            width: '100%',
            maxWidth: '400px',
            height: 'auto'
          }}
          alt='Scout game score'
        />
        <Typography variant='h5' mb={2} fontWeight='700'>
          Let's race to the top!
        </Typography>
        <Stack
          component={FadeIn}
          width='100%'
          borderColor='secondary.main'
          borderRadius='5px'
          sx={{ borderWidth: '1px', borderStyle: 'solid' }}
          flexDirection='column'
          p={4}
        >
          <ScoreTier waitlistSlot={waitlistSlot} />
          <ProgressBar from={0} to={waitlistSlot.percentile ?? 0} />
        </Stack>
        <Typography variant='h5' mb={2} fontWeight='700' color='secondary'>
          Move up the Waitlist!
        </Typography>
        <Button sx={{ width: '100%' }}>Share your Frame</Button>
        <Box width='100%'>
          <Typography variant='body2' color='secondary.light' textAlign='left'>
            Earn 10 Frame Clicks
          </Typography>
          <Button sx={{ width: '100%' }}>Sign up as a Builder</Button>
        </Box>
      </Box>
      <Box>
        <LearnMore />
      </Box>
    </PageWrapper>
  );
}
