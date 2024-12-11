'use client';

import { log } from '@charmverse/core/log';
import type { AuthClientError, StatusAPIResponse } from '@farcaster/auth-kit';
import { useProfile } from '@farcaster/auth-kit';
import { Stack, Button, Typography, Box } from '@mui/material';
import { revalidatePathAction } from '@packages/scoutgame/actions/revalidatePathAction';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';
import { LoadingComponent } from '@packages/scoutgame-ui/components/common/Loading/LoadingComponent';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

import { FarcasterLoginModal } from 'components/common/WarpcastLogin/FarcasterModal';
import { useFarcasterConnection } from 'hooks/useFarcasterConnection';
import { connectFarcasterAccountAction } from 'lib/farcaster/connectFarcasterAccountAction';

export function FarcasterLoginButton({ user }: { user: SessionUser }) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'warpcast-login' });
  const { executeAsync: revalidatePath, isExecuting: isRevalidatingPath } = useAction(revalidatePathAction);
  const { isAuthenticated } = useProfile();
  const { refreshUser } = useUser();

  const {
    executeAsync: connectFarcasterAccount,
    hasErrored,
    isExecuting: isConnectingFarcasterAccount
  } = useAction(connectFarcasterAccountAction, {
    onSuccess: async ({ data }) => {
      if (!data?.success) {
        return;
      }

      await refreshUser();
      await revalidatePath(null);
      popupState.close();
    },
    onError(err) {
      log.error('Error on connecting Farcaster account', { error: err.error.serverError });
      popupState.close();
    }
  });

  const onErrorCallback = useCallback((err?: AuthClientError) => {
    if (err?.errCode === 'unavailable') {
      log.warn('Timed out waiting for Warpcast login', { error: err });
    } else {
      log.error('There was an error while logging in with Warpcast', { error: err });
    }
    popupState.close();
  }, []);

  const onSuccessCallback = useCallback(async (res: StatusAPIResponse) => {
    if (res.message && res.signature) {
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

  const errorMessage =
    connectionError &&
    (connectionError.errCode === 'unavailable'
      ? 'Could not connect to network. Please try again'
      : connectionError.message || hasErrored
        ? 'There was an error while logging in'
        : null);

  return (
    <Stack gap={1}>
      <Typography variant='h5'>Warpcast</Typography>
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
  );
}
