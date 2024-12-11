'use client';

import { log } from '@charmverse/core/log';
import type { AuthClientError, StatusAPIResponse } from '@farcaster/auth-kit';
import { useProfile } from '@farcaster/auth-kit';
import CloseIcon from '@mui/icons-material/Close';
import { LoadingButton } from '@mui/lab';
import { Alert, Box, Button, DialogTitle, Stack, Typography } from '@mui/material';
import { revalidatePathAction } from '@packages/scoutgame/actions/revalidatePathAction';
import { LoadingComponent } from '@packages/scoutgame-ui/components/common/Loading/LoadingComponent';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useState } from 'react';

import type { UserWithAccountsDetails } from 'components/accounts/AccountsPage';
import { Dialog } from 'components/common/Dialog';
import { FarcasterLoginModal } from 'components/common/WarpcastLogin/FarcasterModal';
import { useFarcasterConnection } from 'hooks/useFarcasterConnection';
import type { FarcasterConnectedUser } from 'lib/farcaster/connectFarcasterAccountAction';
import { connectFarcasterAccountAction } from 'lib/farcaster/connectFarcasterAccountAction';
import { mergeUserFarcasterAccountAction } from 'lib/users/mergeUserFarcasterAccountAction';

import { ProfileCard } from '../ProfileSelectCard/ProfileCard';

export function FarcasterLoginButton({ user }: { user: UserWithAccountsDetails }) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'warpcast-login' });
  const { executeAsync: revalidatePath, isExecuting: isRevalidatingPath } = useAction(revalidatePathAction);
  const { isAuthenticated } = useProfile();
  const { refreshUser } = useUser();
  const [connectedUser, setConnectedUser] = useState<FarcasterConnectedUser | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<'current' | 'farcaster' | null>(null);

  const [accountMergeError, setAccountMergeError] = useState<string | null>(null);
  const [farcasterSigninArtifact, setFarcasterSigninArtifact] = useState<{
    message: string;
    signature: string;
    nonce: string;
  } | null>(null);

  const { executeAsync: mergeUserFarcasterAccount, isExecuting: isMergingUserAccount } = useAction(
    mergeUserFarcasterAccountAction,
    {
      onSuccess: async ({ data }) => {
        if (!data?.success) {
          return;
        }

        await revalidatePath(null);
        await refreshUser();
        setFarcasterSigninArtifact(null);
        setConnectedUser(null);
        setAccountMergeError(null);
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
        // If one of the accounts is a builder, user can't select the profile to keep
        if (user.builderStatus !== null || data.connectedUser.builderStatus !== null) {
          setSelectedProfile(null);
        } else {
          setSelectedProfile('current');
        }
      }

      popupState.close();
    },
    onError(err) {
      log.error('Error on connecting Farcaster account', { error: err.error.serverError });
      popupState.close();
    }
  });

  const onErrorCallback = useCallback((err?: AuthClientError) => {
    if (err?.errCode === 'unavailable') {
      log.warn('Timed out waiting for farcaster login', { error: err });
    } else {
      log.error('There was an error while logging in with farcaster', { error: err });
    }
    popupState.close();
  }, []);

  const onSuccessCallback = useCallback(async (res: StatusAPIResponse) => {
    if (res.message && res.signature) {
      setFarcasterSigninArtifact({ message: res.message, signature: res.signature, nonce: res.nonce });
      await connectFarcasterAccount({ message: res.message, signature: res.signature, nonce: res.nonce });
    } else {
      log.error('Did not receive message or signature from Farcaster', res);
    }
  }, []);

  const onClick = useCallback(() => {
    popupState.open();
  }, []);

  const {
    signIn,
    url,
    error: connectionError
  } = useFarcasterConnection({
    onSuccess: onSuccessCallback,
    onError: onErrorCallback,
    onClick
  });

  const isMergeDisabled = connectedUser?.builderStatus !== null && user.builderStatus !== null;

  const errorMessage =
    connectionError &&
    (connectionError.errCode === 'unavailable'
      ? 'Could not connect to network. Please try again'
      : connectionError.message || hasErrored
        ? 'There was an error while logging in'
        : null);

  return (
    <>
      <Stack gap={1}>
        <Typography variant='h5'>Farcaster</Typography>
        {user.farcasterName ? (
          <Typography variant='body1'>{user.farcasterName}</Typography>
        ) : isAuthenticated && (isRevalidatingPath || isConnectingFarcasterAccount) ? (
          <Box width='fit-content'>
            <LoadingComponent size={30} label='Connecting Farcaster account...' />
          </Box>
        ) : (
          <Button sx={{ width: 'fit-content' }} onClick={signIn}>
            Connect
          </Button>
        )}

        {errorMessage && (
          <Typography variant='body2' sx={{ mt: 2 }} color='error'>
            {errorMessage}
          </Typography>
        )}
        <FarcasterLoginModal {...bindPopover(popupState)} url={url} />
      </Stack>
      {connectedUser && (
        <Dialog open={!!connectedUser} onClose={() => setConnectedUser(null)}>
          <DialogTitle sx={{ pb: 0 }} align='center'>
            This farcaster account is connected to another account
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
                onClick={() => setSelectedProfile('farcaster')}
                avatar={connectedUser.avatar}
                identity='farcaster'
                displayName={connectedUser.displayName}
                points={connectedUser.currentBalance}
                nftsPurchased={connectedUser.nftsPurchased}
                isSelected={selectedProfile === 'farcaster'}
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
                identity='farcaster'
                displayName={connectedUser.displayName}
                points={connectedUser.currentBalance}
                nftsPurchased={connectedUser.nftsPurchased}
              />
            </Stack>
          )}

          <Stack alignItems='flex-end' mt={3}>
            <LoadingButton
              variant='contained'
              loading={isMergingUserAccount}
              disabled={isMergingUserAccount || isMergeDisabled}
              onClick={() =>
                mergeUserFarcasterAccount({
                  ...farcasterSigninArtifact,
                  profileToKeep: selectedProfile
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
