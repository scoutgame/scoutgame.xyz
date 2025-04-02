'use client';

import { log } from '@charmverse/core/log';
import { LoadingButton } from '@mui/lab';
import { publishMatchupAction } from '@packages/matchup/publishMatchupAction';
import { revalidatePathAction } from '@packages/nextjs/actions/revalidatePathAction';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

export function SubmitMatchupButton({ disabled, matchupId }: { disabled: boolean; matchupId: string }) {
  const { execute, isExecuting } = useAction(publishMatchupAction, {
    onSuccess: () => {
      revalidatePathAction();
    },
    onError: (error) => {
      log.error('Failed to submit matchup', { error: error.error.serverError });
      toast.error('Failed to submit team');
    }
  });

  const handleSubmitTeam = () => {
    execute({
      matchupId
    });
  };

  return (
    <LoadingButton
      size='large'
      loading={isExecuting}
      variant='contained'
      disabled={disabled}
      onClick={handleSubmitTeam}
    >
      Submit
    </LoadingButton>
  );
}
