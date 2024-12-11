import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { Typography, Stack } from '@mui/material';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';

import { FarcasterLogin } from './components/FarcasterLogin/FarcasterLogin';
import { TelegramLogin } from './components/TelegramLogin';

export type UserWithAccountsDetails = Omit<SessionUser, 'avatar'> & {
  telegramId: bigint | null;
  wallets: string[];
  nftsPurchased: number;
  avatar: string;
  builderStatus: BuilderStatus | null;
};

export function AccountsPage({ user }: { user: UserWithAccountsDetails }) {
  return (
    <Stack gap={2}>
      <Typography variant='h4'>Accounts</Typography>
      <FarcasterLogin user={user} />
      <TelegramLogin user={user} />
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
