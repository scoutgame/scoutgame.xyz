'use client';

import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import CloseIcon from '@mui/icons-material/Close';
import { Alert, LoadingButton } from '@mui/lab';
import { Dialog, DialogTitle, Stack, Typography } from '@mui/material';
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

import { ProfileCard } from './ProfileCard';

const TELEGRAM_BOT_ID = env('TELEGRAM_BOT_ID');

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
        <Dialog open={!!connectedUser} onClose={() => setConnectedUser(null)}>
          <DialogTitle sx={{ pb: 0 }} align='center'>
            This telegram account is connected to another account
          </DialogTitle>
          <DialogTitle sx={{ pt: 0.5 }} variant='body1' align='center'>
            {connectedUser.builderStatus === null && user.builderStatus === null ? (
              <>
                Merge Profile by selecting which one to keep.
                <br />
                Your Points and Scouted Builders will be merged into your current account
              </>
            ) : (
              'Your Points and Scouted Builders will be merged into your current account'
            )}
          </DialogTitle>
          {connectedUser.builderStatus === null && user.builderStatus === null ? (
            <Stack direction='row' gap={2} justifyContent='space-between'>
              <ProfileCard
                onClick={() => setSelectedProfile('current')}
                avatar={user.avatar}
                identity='current'
                displayName={user.displayName}
                points={user.currentBalance}
                nftsPurchased={user.nftsPurchased}
                isSelected={selectedProfile === 'current'}
                disabled={isMergingUserAccount}
              />

              <ProfileCard
                onClick={() => setSelectedProfile('new')}
                avatar={connectedUser.avatar}
                identity='telegram'
                displayName={connectedUser.displayName}
                points={connectedUser.currentBalance}
                nftsPurchased={connectedUser.nftsPurchased}
                isSelected={selectedProfile === 'new'}
                disabled={isMergingUserAccount}
              />
            </Stack>
          ) : isMergeDisabled ? (
            <Alert color='error' icon={<CloseIcon />}>
              Can not merge two builder accounts. Please select a different account to merge.
            </Alert>
          ) : (
            <Stack width='50%' margin='0 auto'>
              <ProfileCard
                avatar={connectedUser.avatar}
                identity='telegram'
                displayName={connectedUser.displayName}
                points={connectedUser.currentBalance}
                nftsPurchased={connectedUser.nftsPurchased}
              />
            </Stack>
          )}

          <Stack alignItems='flex-end' m={3}>
            <LoadingButton
              variant='contained'
              loading={isMergingUserAccount}
              disabled={isMergingUserAccount || isMergeDisabled}
              onClick={() =>
                mergeUserTelegramAccount({
                  authData,
                  selectedProfile
                })
              }
            >
              {isMergingUserAccount ? 'Merging...' : 'Merge'}
            </LoadingButton>
          </Stack>
          {accountMergeError && (
            <Typography variant='body2' textAlign='center' sx={{ mt: 2 }} color='error'>
              {accountMergeError}
            </Typography>
          )}
        </Dialog>
      )}
    </>
  );
}
