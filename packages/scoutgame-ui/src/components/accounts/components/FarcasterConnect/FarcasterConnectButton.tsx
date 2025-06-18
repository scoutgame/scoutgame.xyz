'use client';

import { log } from '@charmverse/core/log';
import type { AuthClientError, StatusAPIResponse } from '@farcaster/auth-kit';
import { SignInButton } from '@farcaster/auth-kit';
import { Paper, Stack, Typography } from '@mui/material';
import type { AuthSchema } from '@packages/farcaster/config';
import { connectFarcasterAccountAction } from '@packages/scoutgame/farcaster/connectFarcasterAccountAction';
import { mergeUserFarcasterAccountAction } from '@packages/scoutgame/farcaster/mergeUserFarcasterAccountAction';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

import '@farcaster/auth-kit/styles.css';
import type { UserWithAccountsDetails } from '../../AccountsPage';
import { useAccountConnect } from '../../hooks/useAccountConnect';
import { AccountConnect } from '../AccountConnect';

export function FarcasterConnectButton({ user }: { user: UserWithAccountsDetails }) {
  const {
    setSelectedProfile,
    isMergeDisabled,
    authData,
    setAuthData,
    setConnectionError,
    mergeAccountOnSuccess,
    mergeAccountOnError,
    connectAccountOnSuccess,
    connectAccountOnError,
    popupState,
    isRevalidatingPath,
    connectionError,
    connectedUser,
    selectedProfile,
    accountMergeError,
    onCloseModal
  } = useAccountConnect<AuthSchema>({ user, identity: 'farcaster' });

  const { executeAsync: mergeUserFarcasterAccount, isExecuting: isMergingUserAccount } = useAction(
    mergeUserFarcasterAccountAction,
    {
      onSuccess: mergeAccountOnSuccess,
      onError: mergeAccountOnError
    }
  );

  const { executeAsync: connectFarcasterAccount, isExecuting: isConnectingFarcasterAccount } = useAction(
    connectFarcasterAccountAction,
    {
      onSuccess: ({ data }) => connectAccountOnSuccess(data?.connectedUser),
      onError: connectAccountOnError
    }
  );

  const onErrorCallback = useCallback((err?: AuthClientError) => {
    if (err?.errCode === 'unavailable') {
      setConnectionError('Timed out waiting for farcaster connect');
      log.warn('Timed out waiting for farcaster connect', { error: err });
    } else {
      setConnectionError('There was an error while logging in with farcaster');
      log.error('There was an error while logging in with farcaster', { error: err });
    }
    popupState.close();
  }, []);

  const onSuccessCallback = useCallback(async ({ message, signature, nonce }: StatusAPIResponse) => {
    if (message && signature) {
      setAuthData({ message, signature, nonce });
      await connectFarcasterAccount({ message, signature, nonce });
    } else {
      setConnectionError('Did not receive message or signature from Farcaster');
      log.error('Did not receive message or signature from Farcaster', { message, signature });
    }
  }, []);

  const isConnecting = isConnectingFarcasterAccount || isRevalidatingPath || isMergingUserAccount;

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Stack gap={2}>
        <Stack direction='row' gap={1} alignItems='center'>
          <Image src='/images/logos/farcaster.png' alt='Farcaster' width={24} height={24} />
          <Typography variant='h6'>Farcaster</Typography>
        </Stack>

        {user.farcasterName ? (
          <Typography variant='body1'>{user.farcasterName}</Typography>
        ) : (
          <SignInButton
            nonce={Math.random().toString(36).substring(2, 10)}
            onSuccess={onSuccessCallback}
            onError={onErrorCallback}
            timeout={300000}
            interval={1500}
            hideSignOut
          />
        )}

        {connectionError && (
          <Typography variant='body2' color='error'>
            {connectionError}
          </Typography>
        )}
      </Stack>
      {connectedUser && (
        <AccountConnect
          identity='farcaster'
          connectedUser={connectedUser}
          onClose={onCloseModal}
          setSelectedProfile={setSelectedProfile}
          selectedProfile={selectedProfile}
          isMergingUserAccount={isMergingUserAccount}
          isMergeDisabled={isMergeDisabled}
          accountMergeError={accountMergeError}
          mergeUserAccount={() => authData && mergeUserFarcasterAccount({ authData, selectedProfile })}
          user={user}
        />
      )}
    </Paper>
  );
}
