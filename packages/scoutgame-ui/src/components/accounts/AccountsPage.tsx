import type { BuilderStatus } from '@charmverse/core/prisma-client';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { Typography, Stack, Paper } from '@mui/material';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';
import { PageContainer } from '@packages/scoutgame-ui/components/layout/PageContainer';
import dynamic from 'next/dynamic';

import { FarcasterConnect } from './components/FarcasterConnect/FarcasterConnect';

export type UserWithAccountsDetails = Omit<SessionUser, 'avatar'> & {
  telegramId: bigint | null;
  wallets: string[];
  avatar: string;
  builderStatus: BuilderStatus | null;
  starterPackNftCount: number;
};

const TelegramConnect = dynamic(() => import('./components/TelegramConnect').then((mod) => mod.TelegramConnect), {
  ssr: false
});

export function AccountsPage({ user }: { user: UserWithAccountsDetails }) {
  return (
    <PageContainer>
      <Stack gap={2} my={2}>
        <Typography variant='h4' color='secondary' fontWeight={600}>
          Accounts
        </Typography>
        <FarcasterConnect user={user} />
        <TelegramConnect user={user} />
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
      </Stack>
    </PageContainer>
  );
}
