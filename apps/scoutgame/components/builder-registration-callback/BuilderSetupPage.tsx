'use client';

import { Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useRef, useState } from 'react';

import { SinglePageLayout } from 'components/common/Layout';
import { LoadingComponent } from 'components/common/Loading/LoadingComponent';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';
import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';
import { setupBuilderProfileAction } from 'lib/builders/setupBuilderProfileAction';

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
    <SinglePageLayout>
      <InfoBackgroundImage />
      <SinglePageWrapper bgcolor='background.default'>
        <Typography variant='h5' color='secondary' mb={2} textAlign='center'>
          Setting up your builder profile...
        </Typography>
        <Typography mb={2}>
          We are setting up your builder profile. This process usually takes a few seconds.
        </Typography>
        {!error && <LoadingComponent isLoading={status === 'executing'} />}
        {error && (
          <Typography variant='body2' sx={{ mt: 2 }} color='error'>
            {error}
          </Typography>
        )}
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}

// fd644bbda13770100a97
