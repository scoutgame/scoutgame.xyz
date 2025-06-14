'use client';

import { log } from '@charmverse/core/log';
import type { AuthClientError, StatusAPIResponse } from '@farcaster/auth-kit';
import { useProfile } from '@farcaster/auth-kit';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useFarcasterConnection } from '@packages/farcaster/hooks/useFarcasterConnection';
import { revalidatePathAction } from '@packages/nextjs/actions/revalidatePathAction';
import { loginWithFarcasterAction } from '@packages/scoutgame/session/loginWithFarcasterAction';
import { LoadingComponent } from '@packages/scoutgame-ui/components/common/Loading/LoadingComponent';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

import { useLoginSuccessHandler } from '../../../hooks/useLoginSuccessHandler';

import { FarcasterLoginModal } from './FarcasterLoginModal';

export function FarcasterLoginButton() {
  const popupState = usePopupState({ variant: 'popover', popupId: 'farcaster-login' });
  const router = useRouter();
  const { refreshUser } = useUser();
  const { isAuthenticated } = useProfile();
  const { params, getNextPageLink } = useLoginSuccessHandler();
  const { inviteCode, referralCode } = params;
  const { executeAsync: revalidatePath, isExecuting: isRevalidatingPath } = useAction(revalidatePathAction);
  const searchParams = useSearchParams();
  const utmCampaign = searchParams.get('utm_campaign');

  const {
    executeAsync: loginUser,
    hasErrored,
    isExecuting: isLoggingIn,
    result
  } = useAction(loginWithFarcasterAction, {
    onSuccess: async ({ data }) => {
      if (!data?.success) {
        return;
      }

      await refreshUser();

      await revalidatePath();

      router.push(getNextPageLink({ onboarded: data?.onboarded }));
    },
    onError(err) {
      log.error('Error on login', { error: err.error.serverError });
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

  const onSuccessCallback = useCallback(
    async (res: StatusAPIResponse) => {
      if (res.message && res.signature) {
        await loginUser({
          message: res.message!,
          nonce: res.nonce,
          signature: res.signature,
          inviteCode,
          referralCode,
          utmCampaign: utmCampaign as string
        });
      } else {
        log.error('Did not receive message or signature from Farcaster', res);
      }
    },
    [inviteCode, referralCode, utmCampaign]
  );

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

  if (isAuthenticated && (isRevalidatingPath || isLoggingIn)) {
    return (
      <Box height={47}>
        <LoadingComponent size={30} label='Logging you in...' />
      </Box>
    );
  }

  const errorMessage =
    (connectionError &&
      (connectionError.errCode === 'unavailable'
        ? 'Could not connect to network. Please try again'
        : connectionError.message)) ||
    (hasErrored &&
      (result?.serverError?.message?.includes('private beta')
        ? 'Scout Game is in private beta'
        : 'There was an error while logging in'));

  return (
    <Box width='100%' data-test='connect-with-farcaster'>
      <Button
        size='large'
        onClick={signIn}
        variant='contained'
        sx={{
          minWidth: '250px',
          px: 2.5,
          py: 1.5
        }}
        data-test='sign-in-with-warpcast'
      >
        <Stack direction='row' alignItems='center' gap={1} justifyContent='flex-start' width='100%'>
          {/** 24px is the size of the wallet button icon */}
          <Box height='24px' width='24px' display='flex' alignItems='center' justifyContent='center'>
            <Image src='/images/logos/farcaster.png' alt='farcaster' width={20} height={20} />
          </Box>
          Sign in with Farcaster
        </Stack>
      </Button>
      {errorMessage && (
        <Typography variant='body2' sx={{ mt: 2 }} color='error'>
          {errorMessage}
        </Typography>
      )}
      <FarcasterLoginModal {...bindPopover(popupState)} url={url} />
    </Box>
  );
}
