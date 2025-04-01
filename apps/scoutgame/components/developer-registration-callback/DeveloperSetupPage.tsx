'use client';

import { log } from '@charmverse/core/log';
import { Box, Link, Typography } from '@mui/material';
import { setupBuilderProfileAction } from '@packages/scoutgame/builders/setupBuilderProfileAction';
import { SinglePageLayout } from '@packages/scoutgame-ui/components/common/Layout';
import { SinglePageWrapper } from '@packages/scoutgame-ui/components/common/SinglePageWrapper';
import { useOnboardingRoutes } from '@packages/scoutgame-ui/providers/OnboardingRoutes';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useRef, useState } from 'react';

export function DeveloperSetupPage({
  state,
  code,
  githubRedirectError
}: {
  githubRedirectError: string;
  state: string;
  code: string;
}) {
  const [githubConnectError, setGithubConnectError] = useState<string | null>(null);
  const router = useRouter();
  const { getNextRoute } = useOnboardingRoutes();
  const ref = useRef(0);
  const { refreshUser } = useUser();
  const { execute: setupBuilderProfile, status } = useAction(setupBuilderProfileAction, {
    onSuccess: async () => {
      await refreshUser();
      router.push(getNextRoute());
    },
    onError: (error) => {
      log.error('Error setting up developer profile', { error });
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
    <SinglePageLayout data-test='registration-callback-page'>
      <SinglePageWrapper bgcolor='background.default' height='auto' hasBorder maxWidth='400px'>
        <Typography variant='h5' color='secondary' mb={2} textAlign='center'>
          Setting up your developer profile...
        </Typography>
        <Typography mb={2}>This process usually takes a few seconds. In the meantime, here is a rainbow.</Typography>
        {!error && (
          <Box width='100%' display='flex' alignItems='center' justifyContent='center'>
            <Image
              src='/images/welcome/cloud-rainbow.png'
              alt='Rainbow'
              width={200}
              height={200}
              sizes='100vw'
              style={{ margin: '0 auto', height: 200, width: 'auto' }}
            />
          </Box>
        )}
        {error && (
          <Typography variant='body2' component='em' sx={{ mt: 2 }} color='error'>
            Something went wrong. Please try again or talk to{' '}
            <Link href='https://warpcast.com/ccarella' target='_blank'>
              @ccarella
            </Link>
            .
          </Typography>
        )}
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}
