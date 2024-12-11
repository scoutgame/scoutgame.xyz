'use client';

import { AuthKitProvider } from '@farcaster/auth-kit';
import { authConfig } from '@packages/farcaster/config';

import type { UserWithAccountsDetails } from 'components/accounts/AccountsPage';

import { FarcasterLoginButton } from './FarcasterLoginButton';

export function FarcasterLogin({ user }: { user: UserWithAccountsDetails }) {
  return (
    <AuthKitProvider config={authConfig}>
      <FarcasterLoginButton user={user} />
    </AuthKitProvider>
  );
}
