'use client';

import { AuthKitProvider } from '@farcaster/auth-kit';
import { authConfig } from '@packages/farcaster/config';

import type { UserWithAccountsDetails } from '../../AccountsPage';

import { FarcasterConnectButton } from './FarcasterConnectButton';

export function FarcasterConnect({ user }: { user: UserWithAccountsDetails }) {
  return (
    <AuthKitProvider config={authConfig}>
      <FarcasterConnectButton user={user} />
    </AuthKitProvider>
  );
}
