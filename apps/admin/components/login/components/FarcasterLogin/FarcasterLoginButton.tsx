'use client';

import { log } from '@charmverse/core/log';
import type { StatusAPIResponse, AuthClientError } from '@farcaster/auth-kit';
import { SignInButton } from '@farcaster/auth-kit';
import type { ButtonProps } from '@mui/material';
import { Box, Typography } from '@mui/material';
import { revalidatePathAction } from '@packages/nextjs/actions/revalidatePathAction';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

import { loginAction } from 'lib/session/loginWithFarcasterAction';
import '@farcaster/auth-kit/styles.css';

export function FarcasterLoginButton({ children, ...props }: ButtonProps) {
  const router = useRouter();

  const { executeAsync: revalidatePath } = useAction(revalidatePathAction);

  const {
    executeAsync: loginUser,
    hasErrored,
    result
  } = useAction(loginAction, {
    onSuccess: async ({ data }) => {
      const nextPage = '/';

      if (!data?.success) {
        return;
      }

      await revalidatePath();
      router.push(nextPage);
    },
    onError(err) {
      log.error('Error on login', { error: err.error.serverError?.message || err.error });
    }
  });

  const onErrorCallback = useCallback((err?: AuthClientError) => {
    if (err?.errCode === 'unavailable') {
      log.warn('Timed out waiting for Warpcast login', { error: err });
    } else {
      log.error('There was an error while logging in with Warpcast', { error: err });
    }
  }, []);

  const onSuccessCallback = useCallback(
    async ({ message, signature, nonce }: StatusAPIResponse) => {
      if (message && signature) {
        await loginUser({ message, nonce, signature });
      } else {
        log.error('Did not receive message or signature from Farcaster', { message, signature });
      }
    },
    [loginUser]
  );

  return (
    <Box width='100%' data-test='connect-with-farcaster'>
      <SignInButton
        nonce={Math.random().toString(36).substring(2, 10)}
        onSuccess={onSuccessCallback}
        onError={onErrorCallback}
        timeout={300000}
        interval={1500}
        hideSignOut
      />
      {hasErrored && (
        <Typography variant='body2' sx={{ mt: 2 }} color='error'>
          {result?.serverError?.message}
        </Typography>
      )}
    </Box>
  );
}
