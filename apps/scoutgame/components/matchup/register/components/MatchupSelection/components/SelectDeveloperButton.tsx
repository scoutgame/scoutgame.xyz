'use client';

import { LoadingButton } from '@mui/lab';
import { getCurrentWeek } from '@packages/dates/utils';
import { addMatchupSelectionAction } from '@packages/matchup/addMatchupSelectionAction';
import { removeMatchupSelectionAction } from '@packages/matchup/removeMatchupSelectionAction';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { useAction } from 'next-safe-action/hooks';

export function SelectDeveloperButton({
  builder,
  matchupId,
  selectedDevelopers
}: {
  builder: BuilderInfo;
  matchupId: string;
  selectedDevelopers: string[];
}) {
  const isSelected = selectedDevelopers.includes(builder.id);
  const { execute, isExecuting } = useAction(isSelected ? removeMatchupSelectionAction : addMatchupSelectionAction);

  function handleAddMatchupSelection() {
    execute({
      matchupId,
      developerId: builder.id
    });
  }

  return (
    <LoadingButton fullWidth loading={isExecuting} onClick={handleAddMatchupSelection}>
      {isSelected ? 'Selected' : 'Select'}
    </LoadingButton>
  );
}
