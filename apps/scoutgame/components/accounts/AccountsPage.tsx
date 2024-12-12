import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { Typography, Stack } from '@mui/material';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';
import dynamic from 'next/dynamic';

import { FarcasterConnect } from './components/FarcasterConnect/FarcasterConnect';

export type UserWithAccountsDetails = Omit<SessionUser, 'avatar'> & {
  telegramId: bigint | null;
  wallets: string[];
  avatar: string;
  builderStatus: BuilderStatus | null;
};

const TelegramConnect = dynamic(() => import('./components/TelegramConnect').then((mod) => mod.TelegramConnect), {
  ssr: false
});

export function AccountsPage({ user }: { user: UserWithAccountsDetails }) {
  return (
    <Stack gap={2}>
      <Typography variant='h4'>Accounts</Typography>
      <FarcasterConnect user={user} />
      <TelegramConnect user={user} />
      <Stack gap={1}>
        <Typography variant='h5'>Wallets</Typography>
        <Stack gap={1}>
          {user.wallets.map((wallet) => (
            <Typography key={wallet}>{wallet}</Typography>
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}
