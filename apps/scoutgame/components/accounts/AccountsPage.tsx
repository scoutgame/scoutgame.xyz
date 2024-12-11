import { Typography, Stack } from '@mui/material';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';

import { FarcasterLogin } from './components/FarcasterLogin/FarcasterLogin';
import { TelegramLogin } from './components/TelegramLogin';

export function AccountsPage({ user }: { user: SessionUser }) {
  return (
    <Stack gap={2}>
      <Typography variant='h4'>Accounts</Typography>
      <FarcasterLogin user={user} />
      <TelegramLogin user={user} />
      <Stack gap={1}>
        <Typography variant='h5'>Wallets</Typography>
        <Stack gap={1}>
          {user.wallets.map((wallet) => (
            <Typography key={wallet.address}>{wallet.address}</Typography>
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}
