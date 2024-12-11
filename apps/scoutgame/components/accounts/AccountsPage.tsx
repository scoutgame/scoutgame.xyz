import { Typography, Stack, Button } from '@mui/material';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';

import { FarcasterLogin } from './components/FarcasterLogin/FarcasterLogin';

export function AccountsPage({ user }: { user: SessionUser }) {
  return (
    <Stack gap={2}>
      <Typography variant='h4'>Accounts</Typography>
      <FarcasterLogin user={user} />
      <Stack gap={1}>
        <Typography variant='h5'>Telegram</Typography>
        {user.telegramId ? (
          <Typography variant='body1'>{user.telegramId}</Typography>
        ) : (
          <Button sx={{ width: 'fit-content' }}>Connect</Button>
        )}
      </Stack>
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
