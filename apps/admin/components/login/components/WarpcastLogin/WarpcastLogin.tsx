'use client';

import { AuthKitProvider } from '@farcaster/auth-kit';
import { authConfig } from '@packages/farcaster/config';
import { Suspense } from 'react';

import { WarpcastLoginButton } from './WarpcastLoginButton';

export function WarpcastLogin() {
  return (
    <AuthKitProvider config={authConfig}>
      <Suspense>
        <WarpcastLoginButton />
      </Suspense>
    </AuthKitProvider>
  );
}
