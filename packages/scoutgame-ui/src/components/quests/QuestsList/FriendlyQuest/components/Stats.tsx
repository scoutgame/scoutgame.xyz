import { Box, Stack, Typography } from '@mui/material';
import type { SessionUser } from '@packages/nextjs/session/interfaces';

import type { Friend } from './MyFriends';

export function Stats({ friendsJoined }: { friendsJoined: number }) {
  const pointsEarned = friendsJoined * 5;

  return (
    <Stack flexDirection={{ xs: 'column', md: 'row' }} justifyContent='space-between' gap={{ xs: 0.5, md: 4 }}>
      <Box>
        <Typography textAlign='center' variant='caption' mb={1} fontWeight={600}>
          FRIENDS JOINED
        </Typography>
        <Stack px={2} py={0.5} gap={1} bgcolor='primary.dark' borderRadius='30px'>
          <Typography variant='h5' component='p' fontWeight={600} textAlign='center' color='secondary'>
            {friendsJoined}
          </Typography>
        </Stack>
      </Box>
      <Box>
        <Typography textAlign='center' variant='caption' mb={1} fontWeight={600}>
          TOKENS EARNED
        </Typography>
        <Stack
          px={2}
          py={0.5}
          gap={1}
          bgcolor='primary.dark'
          flexDirection='row'
          alignItems='center'
          justifyContent='center'
          borderRadius='30px'
        >
          <Typography variant='h5' component='p' fontWeight={600} textAlign='center' color='secondary'>
            {pointsEarned}
          </Typography>
          <img src='/images/crypto/op.png' alt='' width={20} height={20} />
        </Stack>
      </Box>
    </Stack>
  );
}
