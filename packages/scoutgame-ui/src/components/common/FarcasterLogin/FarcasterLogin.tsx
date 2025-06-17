'use client';

import { AuthKitProvider } from '@farcaster/auth-kit';
import { Link, Typography } from '@mui/material';
import { getAuthConfig } from '@packages/farcaster/config';
import { Suspense } from 'react';

import { useTrackEvent } from '../../../hooks/useTrackEvent';

import { FarcasterLoginButton } from './FarcasterLoginButton';

export function FarcasterLogin() {
  const trackEvent = useTrackEvent();
  const authConfig = getAuthConfig();

  return (
    <AuthKitProvider config={authConfig}>
      <FarcasterLoginButton />
      <Link
        href='https://www.farcaster.xyz/'
        target='_blank'
        rel='noopener'
        fontWeight={500}
        display='block'
        onMouseDown={() => {
          trackEvent('click_dont_have_farcaster_account');
        }}
      >
        <Typography
          fontWeight={600}
          color='primary'
          sx={{
            textShadow:
              '2px 2px 8px rgba(0, 0, 0, .7),-2px -2px 8px rgba(0, 0, 0, .7),2px -2px 8px rgba(0, 0, 0, .7),-2px 2px 8px rgba(0, 0, 0, .7);'
          }}
        >
          Join Farcaster
        </Typography>
      </Link>
    </AuthKitProvider>
  );
}
