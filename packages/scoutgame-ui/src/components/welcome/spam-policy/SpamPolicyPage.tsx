'use client';

import { Button, Typography } from '@mui/material';
import { saveOnboardedAction } from '@packages/scoutgame/users/saveOnboardedAction';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';

import { SinglePageLayout } from '../../common/Layout';
import { SinglePageWrapper } from '../../common/SinglePageWrapper';
import { InfoBackgroundImage } from '../../layout/InfoBackgroundImage';

export function SpamPolicyPage({ redirectToProfile }: { redirectToProfile: boolean }) {
  const { user } = useUser();
  const router = useRouter();
  // programmatically added builders will land here skipping the /welcome/builder page
  // we set the onboardedAt flag on that page, so make sure we set it here too if the user hasn't been onboarded yet
  const { executeAsync, isExecuting } = useAction(saveOnboardedAction, {
    onSuccess: () => {
      // Redirect the programmatically added builders to the /how-it-works page to continue with the normal flow
      router.push('/welcome/how-it-works');
    }
  });

  return (
    <SinglePageLayout>
      <InfoBackgroundImage />
      <SinglePageWrapper bgcolor='background.default'>
        <Typography variant='h5' color='secondary' mb={2} textAlign='center'>
          Spam Policy
        </Typography>
        <Typography mb={2}>The Scout Game has a strict no spam policy.</Typography>
        <Typography mb={2}>
          If 3 of your PRs are rejected, your account will be labeled as spam. You will be suspended from Scout Game and
          unable to score points.
        </Typography>
        <Typography mb={2}>
          If you are suspended, you may appeal this decision. An appeal link will be included in the suspension
          notification.
        </Typography>
        {user ? (
          user.onboardedAt ? (
            <Button
              LinkComponent={Link}
              href={redirectToProfile ? '/profile' : '/welcome/how-it-works'}
              data-test='continue-button'
              disabled={isExecuting}
              sx={{ margin: '0 auto', display: 'flex' }}
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={() => executeAsync()}
              data-test='continue-button'
              disabled={isExecuting}
              sx={{ margin: '0 auto', display: 'flex' }}
            >
              Continue
            </Button>
          )
        ) : null}
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}
