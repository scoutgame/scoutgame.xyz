'use client';

import { log } from '@charmverse/core/log';
import { Box, Typography } from '@mui/material';
import { useGetUserTrigger } from '@packages/scoutgame-ui/hooks/api/session';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import { FarcasterLogin } from '../common/FarcasterLogin/FarcasterLogin';
import { SinglePageLayout } from '../common/Layout';
import { WalletLogin } from '../common/WalletLogin/WalletLogin';

export function LoginPage() {
  const { trigger: triggerReload } = useGetUserTrigger();
  const router = useRouter();
  // HACK: Remove this after we change session cookies to LAX
  useEffect(() => {
    async function loadUser() {
      const updated = await triggerReload();
      if (updated) {
        log.info('Redirect user to profile from login page', { userId: updated.id });
        router.push('/profile?tab=win');
      }
    }
    loadUser();
  }, []);

  return (
    <SinglePageLayout position='relative' zIndex={2} data-test='login-page'>
      <Image
        src='/images/scout-game-logo-square.png'
        width={300}
        height={150}
        sizes='100vw'
        style={{
          width: '100%',
          maxWidth: '300px',
          height: 'auto'
        }}
        alt='ScoutGame'
      />
      <Typography
        variant='h5'
        sx={{
          mb: 4,
          fontWeight: 700,
          backgroundColor: 'black',
          px: 1
        }}
      >
        Fantasy sports with onchain developers
      </Typography>
      <Box display='flex' flexDirection='column' gap={2} width='100%'>
        <WalletLogin />
        <FarcasterLogin />
      </Box>
    </SinglePageLayout>
  );
}
