'use client';

import { log } from '@charmverse/core/log';
import type { AuthClientError, StatusAPIResponse } from '@farcaster/auth-kit';
import { LoadingButton } from '@mui/lab';
import { Stack, Typography } from '@mui/material';
import { revalidatePathAction } from '@packages/scoutgame/actions/revalidatePathAction';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useState } from 'react';

import type { UserWithAccountsDetails } from 'components/accounts/AccountsPage';
import { FarcasterLoginModal } from 'components/common/WarpcastLogin/FarcasterModal';
import { useFarcasterConnection } from 'hooks/useFarcasterConnection';
import { connectFarcasterAccountAction } from 'lib/farcaster/connectFarcasterAccountAction';
import { mergeUserFarcasterAccountAction } from 'lib/farcaster/mergeUserFarcasterAccountAction';
import type { UserAccountMetadata } from 'lib/users/getUserAccount';
import type { ProfileToKeep } from 'lib/users/mergeUserAccount';

import { AccountConnect } from '../AccountConnect';

export function FarcasterConnectButton({ user }: { user: UserWithAccountsDetails }) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'farcaster-connect' });
  const { executeAsync: revalidatePath, isExecuting: isRevalidatingPath } = useAction(revalidatePathAction);
  const [connectionError, setConnectionError] = useState<null | string>(null);
  const { refreshUser } = useUser();
  const [connectedUser, setConnectedUser] = useState<UserAccountMetadata | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProfileToKeep>('current');
  const [accountMergeError, setAccountMergeError] = useState<string | null>(null);
  const [authData, setAuthData] = useState<{
    message: string;
    signature: string;
    nonce: string;
  } | null>(null);

  const { executeAsync: mergeUserFarcasterAccount, isExecuting: isMergingUserAccount } = useAction(
    mergeUserFarcasterAccountAction,
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
        setAccountMergeError('Error merging farcaster account');
      }
    }
  );

  const {
    executeAsync: connectFarcasterAccount,
    hasErrored,
    isExecuting: isConnectingFarcasterAccount
  } = useAction(connectFarcasterAccountAction, {
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
        }
        // else if the merged user is a builder, we want to keep the merged user profile
        else if (data.connectedUser.builderStatus !== null) {
          setSelectedProfile('new');
        }
        // Otherwise if none of the users are builders, we want to keep the one selected by the user
        else {
          setSelectedProfile('current');
        }
      }

      popupState.close();
    },
    onError(err) {
      log.error('Error on connecting Farcaster account', { error: err.error.serverError });
      setConnectionError('Error connecting Farcaster account');
      popupState.close();
    }
  });

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

  const isMergeDisabled = connectedUser?.builderStatus !== null && user.builderStatus !== null;

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
