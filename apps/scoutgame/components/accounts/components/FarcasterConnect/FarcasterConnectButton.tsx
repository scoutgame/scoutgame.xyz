'use client';

import { log } from '@charmverse/core/log';
import type { AuthClientError, StatusAPIResponse } from '@farcaster/auth-kit';
import { LoadingButton } from '@mui/lab';
import { Stack, Typography } from '@mui/material';
import { bindPopover } from 'material-ui-popup-state/hooks';
import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

import type { UserWithAccountsDetails } from 'components/accounts/AccountsPage';
import { useAccountConnect } from 'components/accounts/hooks/useAccountConnect';
import { FarcasterLoginModal } from 'components/common/WarpcastLogin/FarcasterModal';
import { useFarcasterConnection } from 'hooks/useFarcasterConnection';
import { connectFarcasterAccountAction } from 'lib/farcaster/connectFarcasterAccountAction';
import { mergeUserFarcasterAccountAction } from 'lib/farcaster/mergeUserFarcasterAccountAction';

import { AccountConnect } from '../AccountConnect';

export function FarcasterConnectButton({ user }: { user: UserWithAccountsDetails }) {
  const {
    setConnectedUser,
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
    accountMergeError
  } = useAccountConnect({ user });

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

  const onSuccessCallback = useCallback(async (res: StatusAPIResponse) => {
    if (res.message && res.signature) {
      setAuthData({ message: res.message, signature: res.signature, nonce: res.nonce });
      await connectFarcasterAccount({ message: res.message, signature: res.signature, nonce: res.nonce });
    } else {
      setConnectionError('Did not receive message or signature from Farcaster');
      log.error('Did not receive message or signature from Farcaster', res);
    }
  }, []);

  const onClick = useCallback(() => {
    popupState.open();
  }, []);

  const { signIn, url } = useFarcasterConnection({
    onSuccess: onSuccessCallback,
    onError: onErrorCallback,
    onClick
  });

  const isConnecting = isConnectingFarcasterAccount || isRevalidatingPath;

  return (
    <>
      <Stack gap={1}>
        <Typography variant='h5'>Farcaster</Typography>
        {user.farcasterName ? (
          <Typography variant='body1'>{user.farcasterName}</Typography>
        ) : (
          <LoadingButton
            disabled={isConnecting}
            loading={isConnecting}
            sx={{ width: 'fit-content' }}
            onClick={signIn}
            variant='contained'
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </LoadingButton>
        )}

        {connectionError && (
          <Typography variant='body2' sx={{ mt: 2 }} color='error'>
            {connectionError}
          </Typography>
        )}
        <FarcasterLoginModal {...bindPopover(popupState)} url={url} />
      </Stack>
      {connectedUser && (
        <AccountConnect
          identity='farcaster'
          connectedUser={connectedUser}
          onClose={() => setConnectedUser(null)}
          setSelectedProfile={setSelectedProfile}
          selectedProfile={selectedProfile}
          isMergingUserAccount={isMergingUserAccount}
          isMergeDisabled={isMergeDisabled}
          accountMergeError={accountMergeError}
          mergeUserAccount={() => mergeUserFarcasterAccount({ authData, selectedProfile })}
          user={user}
        />
      )}
    </>
  );
}
