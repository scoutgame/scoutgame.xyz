'use client';

import { AuthKitProvider } from '@farcaster/auth-kit';
import { authConfig } from '@packages/farcaster/config';

import { FarcasterLoginButton } from './FarcasterLoginButton';

export function FarcasterLogin() {
  return (
    <AuthKitProvider config={authConfig}>
      <FarcasterLoginButton />
    </AuthKitProvider>
  );
}
