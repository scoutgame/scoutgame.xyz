'use client';

import { log } from '@charmverse/core/log';
import { Link, Paper, Typography } from '@mui/material';
import { setupBuilderProfileAction } from '@packages/scoutgame/builders/setupBuilderProfileAction';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useRef, useState } from 'react';

import { LoadingComponent } from '../common/Loading/LoadingComponent';

export function BuilderSetupPage({
  state,
  code,
  githubRedirectError,
  redirectToProfile
}: {
  redirectToProfile: string;
  githubRedirectError: string;
  state: string;
  code: string;
}) {
  const [githubConnectError, setGithubConnectError] = useState<string | null>(null);
  const router = useRouter();
  const ref = useRef(0);
  const { execute: setupBuilderProfile, status } = useAction(setupBuilderProfileAction, {
    onSuccess: () => {
      router.push(redirectToProfile ? '/welcome/spam-policy?profile-redirect=true' : '/welcome/spam-policy');
    },
    onError: (error) => {
      log.error('Error setting up builder profile', { error });
      setGithubConnectError(error.error.serverError?.message || 'Something went wrong');
    }
  });

  useEffect(() => {
    if (ref.current !== 0) {
      return;
    }
    ref.current = 1;
    if (state && code) {
      setupBuilderProfile({ state, code });
    } else {
      setGithubConnectError('No state or code provided');
    }
  }, [state, code, setupBuilderProfile]);

  const error = githubConnectError || githubRedirectError;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant='h5' color='secondary' mb={2} textAlign='center'>
        Setting up your builder profile...
      </Typography>
      <Typography mb={2}>We are setting up your builder profile. This process usually takes a few seconds.</Typography>
      {!error && <LoadingComponent isLoading={status === 'executing'} />}
      {error && (
        <Typography variant='body2' component='em' sx={{ mt: 2 }}>
          Something went wrong. Please try again or talk to{' '}
          <Link href='https://warpcast.com/ccarella' target='_blank'>
            @ccarella
          </Link>
          .
        </Typography>
      )}
    </Paper>
  );
}
