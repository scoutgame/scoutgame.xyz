'use client';

import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import { LoadingButton } from '@mui/lab';
import { Stack, Typography } from '@mui/material';
import { revalidatePathAction } from '@packages/scoutgame/actions/revalidatePathAction';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useEffect, useState } from 'react';

import { connectTelegramAccountAction } from 'lib/telegram/connectTelegramAccountAction';
import { mergeUserTelegramAccountAction } from 'lib/telegram/mergeUserTelegramAccountAction';
import type { UserAccountMetadata } from 'lib/users/getUserAccount';
import type { ProfileToKeep } from 'lib/users/mergeUserAccount';

import type { UserWithAccountsDetails } from '../AccountsPage';

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
  const popupState = usePopupState({ variant: 'popover', popupId: 'telegram-connect' });
  const { refreshUser } = useUser();
  const [authData, setAuthData] = useState<TelegramAccount | null>(null);
  const [connectedUser, setConnectedUser] = useState<UserAccountMetadata | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProfileToKeep>('current');
  const [accountMergeError, setAccountMergeError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { executeAsync: revalidatePath, isExecuting: isRevalidatingPath } = useAction(revalidatePathAction);
  const { executeAsync: mergeUserTelegramAccount, isExecuting: isMergingUserAccount } = useAction(
    mergeUserTelegramAccountAction,
    {
      onSuccess: async () => {
        setAuthData(null);
        setConnectedUser(null);
        setAccountMergeError(null);
        await revalidatePath(null);
        await refreshUser();
      },
      onError: (err) => {
        log.error('Error merging user account', { error: err.error.serverError });
        setAccountMergeError('Error merging telegram account');
      }
    }
  );

  const { executeAsync: connectTelegramAccount, isExecuting: isConnectingTelegramAccount } = useAction(
    connectTelegramAccountAction,
    {
      onSuccess: async ({ data }) => {
        if (!data?.success) {
          return;
        }

        if (!data.connectedUser) {
          await refreshUser();
          await revalidatePath(null);
        } else {
          setConnectedUser(data.connectedUser);
          // If the current user is a builder, we want to keep the current profile
          if (user.builderStatus !== null) {
            setSelectedProfile('current');
          } else if (data.connectedUser.builderStatus !== null) {
            setSelectedProfile('new');
          } else {
            setSelectedProfile('new');
          }
        }

        popupState.close();
      },
      onError: (err) => {
        log.error('Error on connecting Telegram account', { error: err.error.serverError });
        setConnectionError('Error connecting Telegram account');
        popupState.close();
      }
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

  const isMergeDisabled = connectedUser?.builderStatus !== null && user.builderStatus !== null;
  const isConnecting = isConnectingTelegramAccount || isRevalidatingPath;

  return (
    <>
      <Stack gap={1}>
        <Typography variant='h5'>Telegram</Typography>
        {user.telegramId ? (
          <Typography variant='body1'>{user.telegramId}</Typography>
        ) : (
          <>
            <LoadingButton
              disabled={isConnecting}
              loading={isConnecting}
              sx={{ width: 'fit-content' }}
              onClick={() => loginWithTelegram(handleConnectTelegramAccount)}
              variant='contained'
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </LoadingButton>
            <div style={{ visibility: 'hidden' }} id='telegram-login-container' />
          </>
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
          mergeUserAccount={() => mergeUserTelegramAccount({ authData, selectedProfile })}
          onClose={() => setConnectedUser(null)}
          selectedProfile={selectedProfile}
          setSelectedProfile={setSelectedProfile}
          user={user}
          connectedUser={connectedUser}
        />
      )}
    </>
  );
}
