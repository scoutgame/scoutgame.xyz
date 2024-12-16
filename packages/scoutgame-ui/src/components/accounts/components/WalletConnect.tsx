import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { Paper, Stack, Typography } from '@mui/material';

import type { UserWithAccountsDetails } from '../AccountsPage';

export function WalletConnect({ user }: { user: UserWithAccountsDetails }) {
  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Stack gap={1}>
        <Stack direction='row' gap={1} alignItems='center'>
          <AccountBalanceWalletOutlinedIcon />
          <Typography variant='h6'>Wallets</Typography>
        </Stack>
        <Stack gap={1}>
          {user.wallets.map((wallet) => (
            <Typography key={wallet}>{wallet}</Typography>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
