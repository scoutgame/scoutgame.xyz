'use client';

import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import { useGlobalModal } from '../../../providers/ModalProvider';

export function BuilderPageInviteCard() {
  const { openModal } = useGlobalModal();

  return (
    <Paper
      sx={{
        p: {
          xs: 2,
          md: 4
        },
        my: {
          xs: 0.5,
          md: 1
        },
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}
    >
      <Stack flexDirection='row' alignItems='center' margin='auto'>
        <Box display={{ xs: 'block', md: 'none' }} justifyContent='center'>
          <Image src='/images/profile/builder-dog.png' alt='be a builder' width={80} height={80} />
        </Box>
        <Box>
          <Typography variant='h5' fontWeight={600} color='secondary' textAlign='center' mb={1}>
            Write code
          </Typography>
          <Typography variant='h5' fontWeight={600} color='secondary' textAlign='center'>
            Earn rewards
          </Typography>
        </Box>
      </Stack>
      <Typography variant='h6' lineHeight={1.3} textAlign='center'>
        Become a developer in the Scout Game and earn rewards for contributing to over a thousand open source crypto
        repositories.
      </Typography>
      <Button
        onClick={() => openModal('newBuilder')}
        color='primary'
        sx={{ cursor: 'pointer', width: 200, textAlign: 'center', fontWeight: 400, margin: '0 auto' }}
      >
        Get Started
      </Button>
      <Box display={{ xs: 'none', md: 'flex' }} justifyContent='center'>
        <Image src='/images/profile/builder-dog.png' alt='be a builder' width={300} height={300} />
      </Box>
    </Paper>
  );
}
