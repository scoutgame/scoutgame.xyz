'use client';

import { Button, Typography } from '@mui/material';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { saveOnboardedAction } from '@packages/users/saveOnboardedAction';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';

import { useOnboardingRoutes } from '../../../providers/OnboardingRoutes';
import { SinglePageLayout } from '../../common/Layout';
import { SinglePageWrapper } from '../../common/SinglePageWrapper';

export function SpamPolicyPage() {
  const { user } = useUser();
  const router = useRouter();
  const { getNextRoute } = useOnboardingRoutes();
  // programmatically added builders will land here skipping the /welcome/builder page
  // we set the onboardedAt flag on that page, so make sure we set it here too if the user hasn't been onboarded yet
  const { executeAsync, isExecuting } = useAction(saveOnboardedAction, {
    onSuccess: () => {
      router.push(getNextRoute());
    }
  });

  return (
    <SinglePageLayout data-test='spam-policy-page'>
      <SinglePageWrapper bgcolor='background.default' height='auto' hasBorder maxWidth='400px'>
        <Typography variant='h5' color='secondary' mb={2} textAlign='center'>
          Spam Policy
        </Typography>
        <Typography mb={2}>The Scout Game has a strict no spam policy.</Typography>
        <Typography mb={2}>
          If 3 of your PRs are rejected, your account will be labeled as spam. You will be suspended from Scout Game and
          unable to score DEV tokens.
        </Typography>
        <Typography mb={2}>
          If you are suspended, you may appeal this decision. An appeal link will be included in the suspension
          notification.
        </Typography>
        {user ? (
          user.onboardedAt ? (
            <Button
              onClick={() => router.push(getNextRoute())}
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
