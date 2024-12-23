'use client';

import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { LoadingButton } from '@mui/lab';
import { Typography, Stack, Skeleton, Button } from '@mui/material';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';
import { PageContainer } from '@packages/scoutgame-ui/components/layout/PageContainer';
import dynamic from 'next/dynamic';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useRef, useState } from 'react';

import { generateTelegramQrCodeAction } from '../../actions/generateTelegramQrCode';
import { verifyTelegramTokenAction } from '../../actions/verifyTelegramToken';

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
  const [qrCode, setQrCode] = useState<string | null>(null);
  const ref = useRef<NodeJS.Timeout | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { execute, isExecuting } = useAction(generateTelegramQrCodeAction, {
    onSuccess: (data) => {
      if (data.data?.qrCodeImage) {
        setQrCode(data.data.qrCodeImage);
      }

      if (data.data?.sessionId) {
        setSessionId(data.data.sessionId);
      }
    }
  });

  const { execute: verifyToken } = useAction(verifyTelegramTokenAction, {
    onSuccess: ({ data }) => {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    }
  });

  useEffect(() => {
    if (sessionId) {
      ref.current = setTimeout(() => {
        verifyToken({ sessionId });
      }, 2500);
    }
  }, [sessionId]);

  return (
    <PageContainer>
      <Stack gap={2} my={2}>
        <Typography variant='h4' color='secondary' fontWeight={600}>
          Accounts
        </Typography>
        <LoadingButton
          variant='contained'
          sx={{ width: 'fit-content' }}
          onClick={() => execute()}
          loading={isExecuting}
        >
          {isExecuting ? 'Generating...' : 'Generate QR Code'}
        </LoadingButton>
        {qrCode && <img style={{ width: 250, height: 250 }} src={qrCode} alt='QR Code' />}
        <FarcasterConnect user={user} />
        <TelegramConnect user={user} />
        <WalletConnect user={user} />
      </Stack>
    </PageContainer>
  );
}
