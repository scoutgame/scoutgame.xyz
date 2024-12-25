import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { Skeleton, Stack, Typography } from '@mui/material';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';
import { PageContainer } from '@packages/scoutgame-ui/components/layout/PageContainer';
import dynamic from 'next/dynamic';

import { FarcasterConnect } from './components/FarcasterConnect/FarcasterConnect';
import { WalletConnect } from './components/WalletConnect';

export type UserWithAccountsDetails = Omit<SessionUser, 'avatar'> & {
  telegramId: bigint | null;
  wallets: string[];
  avatar: string;
  builderStatus: BuilderStatus | null;
  starterPackNftCount: number;
};

const TelegramConnect = dynamic(() => import('./components/TelegramConnect').then((mod) => mod.TelegramConnect), {
  ssr: false,
  loading: () => <Skeleton variant='rectangular' height={100} />
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
        <WalletConnect user={user} />
      </Stack>
    </PageContainer>
  );
}
