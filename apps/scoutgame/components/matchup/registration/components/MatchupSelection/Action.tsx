'use client';

import { LoadingButton } from '@mui/lab';
import { getCurrentWeek } from '@packages/dates/utils';
import { addMatchupSelectionAction } from '@packages/matchup/addMatchupSelectionAction';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { useAction } from 'next-safe-action/hooks';

export function ActionSlot({ builder }: { builder: BuilderInfo }) {
  const { execute, isExecuting } = useAction(addMatchupSelectionAction);

  function handleAddMatchupSelection() {
    execute({
      week: getCurrentWeek(),
      developerId: builder.id
    });
  }

  return (
    <LoadingButton fullWidth loading={isExecuting} onClick={handleAddMatchupSelection}>
      Select
    </LoadingButton>
  );
}
