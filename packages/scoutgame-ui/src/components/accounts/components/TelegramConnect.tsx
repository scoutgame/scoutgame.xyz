'use client';

import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import { LoadingButton } from '@mui/lab';
import { Paper, Stack, Typography } from '@mui/material';
import { connectTelegramAccountAction } from '@packages/scoutgame/telegram/connectTelegramAccountAction';
import { mergeUserTelegramAccountAction } from '@packages/scoutgame/telegram/mergeUserTelegramAccountAction';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useEffect } from 'react';

import type { UserWithAccountsDetails } from '../AccountsPage';
import { useAccountConnect } from '../hooks/useAccountConnect';

import { AccountConnect } from './AccountConnect';

export type TelegramAccount = {
  auth_date: number;
  first_name: string;
  hash: string;
  id: number;
  last_name: string;
  photo_url: string;
  username: string;
};

export function loginWithTelegram(callback: (user: TelegramAccount) => void) {
  const TELEGRAM_BOT_ID = env('TELEGRAM_BOT_ID');
  // @ts-ignore - defined by the script: https://telegram.org/js/telegram-widget.js
  window.Telegram.Login.auth({ bot_id: TELEGRAM_BOT_ID, request_access: true }, callback);
}

export function TelegramConnect({ user }: { user: UserWithAccountsDetails }) {
  const {
    isRevalidatingPath,
    connectAccountOnSuccess,
    connectAccountOnError,
    mergeAccountOnSuccess,
    mergeAccountOnError,
    selectedProfile,
    accountMergeError,
    connectionError,
    setConnectionError,
    setAuthData,
    connectedUser,
    setConnectedUser,
    setSelectedProfile,
    isMergeDisabled,
    authData
  } = useAccountConnect<TelegramAccount>({ user });

  const { executeAsync: mergeUserTelegramAccount, isExecuting: isMergingUserAccount } = useAction(
    mergeUserTelegramAccountAction,
    {
      onSuccess: mergeAccountOnSuccess,
      onError: mergeAccountOnError
    }
  );

  const { executeAsync: connectTelegramAccount, isExecuting: isConnectingTelegramAccount } = useAction(
    connectTelegramAccountAction,
    {
      onSuccess: ({ data }) => connectAccountOnSuccess(data?.connectedUser),
      onError: connectAccountOnError
    }
  );

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    document.getElementById('telegram-login-container')?.appendChild(script);
  }, []);

  const handleConnectTelegramAccount = useCallback((telegramAccount: TelegramAccount) => {
    if (telegramAccount && 'id' in telegramAccount && 'hash' in telegramAccount) {
      setAuthData(telegramAccount);
      connectTelegramAccount(telegramAccount);
    } else {
      log.error('Invalid Telegram account', { telegramAccount });
      setConnectionError('Invalid Telegram account');
    }
  }, []);

  const isConnecting = isConnectingTelegramAccount || isRevalidatingPath;

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Stack gap={2}>
        <Stack direction='row' gap={1} alignItems='center'>
          <Image src='/images/logos/telegram.png' alt='Telegram' width={24} height={24} />
          <Typography variant='h6'>Telegram</Typography>
        </Stack>
        {user.telegramId ? (
          <Typography variant='body1'>{user.telegramId}</Typography>
        ) : (
          <LoadingButton
            disabled={isConnecting}
            loading={isConnecting}
            sx={{ width: 'fit-content' }}
            onClick={() => loginWithTelegram(handleConnectTelegramAccount)}
            variant='contained'
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
            <div style={{ visibility: 'hidden' }} id='telegram-login-container' />
          </LoadingButton>
        )}

        {connectionError && (
          <Typography variant='body2' sx={{ mt: 2 }} color='error'>
            {connectionError}
          </Typography>
        )}
      </Stack>
      {connectedUser && (
        <AccountConnect
          identity='telegram'
          accountMergeError={accountMergeError}
          isMergeDisabled={isMergeDisabled}
          isMergingUserAccount={isMergingUserAccount}
          mergeUserAccount={() => authData && mergeUserTelegramAccount({ authData, selectedProfile })}
          onClose={() => setConnectedUser(null)}
          selectedProfile={selectedProfile}
          setSelectedProfile={setSelectedProfile}
          user={user}
          connectedUser={connectedUser}
        />
      )}
    </Paper>
  );
}
