'use client';

import { Button, Stack, Typography } from '@mui/material';
import { saveOnboardedAction } from '@packages/users/saveOnboardedAction';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';

export function SkipBuilderStepButton() {
  const router = useRouter();
  const { executeAsync, isExecuting } = useAction(saveOnboardedAction, {
    onSuccess: () => {
      router.push('/welcome/how-it-works');
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
