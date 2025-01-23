'use client';

import { Button, Stack, Typography } from '@mui/material';
import { saveOnboardedAction } from '@packages/users/saveOnboardedAction';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';

import { useOnboardingRoutes } from '../../../../providers/OnboardingRoutes';

export function SkipBuilderStepButton() {
  const router = useRouter();
  const { getNextRoute } = useOnboardingRoutes();
  const { executeAsync, isExecuting } = useAction(saveOnboardedAction, {
    onSuccess: () => {
      router.push(getNextRoute());
    }
  });

  return (
    <Stack direction='row' justifyContent='center'>
      <Button variant='text' onClick={() => executeAsync()} disabled={isExecuting} data-test='continue-button'>
        <Typography color='primary'>Skip for now</Typography>
      </Button>
    </Stack>
  );
}
