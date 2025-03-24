'use client';

import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { builderLoginUrl } from '@packages/scoutgame/constants';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useGlobalModal } from '../../../providers/ModalProvider';
import { useUser } from '../../../providers/UserProvider';

import { WalletConnect } from './WalletConnect';

export function BuilderPageInviteCard({ isBuilder }: { isBuilder: boolean }) {
  const { openModal } = useGlobalModal();
  const { user } = useUser();
  const router = useRouter();

  const handleButtonClick = () => {
    if (user) {
      openModal('newBuilder');
    } else {
      router.push(builderLoginUrl);
    }
  };

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
        {!isBuilder ? 'Become a developer in the Scout Game' : 'Connect your primary wallet'} and earn rewards for
        contributing to over a thousand open source crypto repositories.
      </Typography>
      {!isBuilder ? (
        <Button
          onClick={handleButtonClick}
          color='primary'
          sx={{ cursor: 'pointer', width: 200, textAlign: 'center', fontWeight: 400, margin: '0 auto' }}
        >
          Get Started
        </Button>
      ) : (
        <WalletConnect />
      )}
      <Box display={{ xs: 'none', md: 'flex' }} justifyContent='center'>
        <Image src='/images/profile/builder-dog.png' alt='be a builder' width={300} height={300} />
      </Box>
    </Paper>
  );
}
