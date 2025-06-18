'use client';

import { log } from '@charmverse/core/log';
import type { AuthClientError, StatusAPIResponse } from '@farcaster/auth-kit';
import { SignInButton, useProfile } from '@farcaster/auth-kit';
import { Box, Typography } from '@mui/material';
import { revalidatePathAction } from '@packages/nextjs/actions/revalidatePathAction';
import { loginWithFarcasterAction } from '@packages/scoutgame/session/loginWithFarcasterAction';
import { LoadingComponent } from '@packages/scoutgame-ui/components/common/Loading/LoadingComponent';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

import { useLoginSuccessHandler } from '../../../hooks/useLoginSuccessHandler';
import '@farcaster/auth-kit/styles.css';

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
    async ({ message, signature, nonce }: StatusAPIResponse) => {
      if (message && signature) {
        await loginUser({
          message,
          nonce,
          signature,
          inviteCode,
          referralCode,
          utmCampaign: utmCampaign as string
        });
      } else {
        log.error('Did not receive message or signature from Farcaster', { message, signature });
      }
    },
    [inviteCode, referralCode, utmCampaign]
  );

  if (isAuthenticated && (isRevalidatingPath || isLoggingIn)) {
    return (
      <Box height={47}>
        <LoadingComponent size={30} label='Logging you in...' />
      </Box>
    );
  }

  const errorMessage =
    hasErrored &&
    (result?.serverError?.message?.includes('private beta')
      ? 'Scout Game is in private beta'
      : 'There was an error while logging in');

  return (
    <Box width='100%' data-test='connect-with-farcaster' display='flex' flexDirection='column' alignItems='center'>
      <SignInButton
        nonce={Math.random().toString(36).substring(2, 10)}
        onSuccess={onSuccessCallback}
        onError={onErrorCallback}
        timeout={300000}
        interval={1500}
        hideSignOut
      />
      {errorMessage && (
        <Typography variant='body2' sx={{ mt: 2 }} color='error'>
          {errorMessage}
        </Typography>
      )}
    </Box>
  );
}
