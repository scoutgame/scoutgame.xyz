'use client';

import { AuthKitProvider } from '@farcaster/auth-kit';
import { authConfig } from '@packages/farcaster/config';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';

import { FarcasterLoginButton } from './FarcasterLoginButton';

export function FarcasterLogin({ user }: { user: SessionUser }) {
  return (
    <AuthKitProvider config={authConfig}>
      <FarcasterLoginButton user={user} />
    </AuthKitProvider>
  );
}
