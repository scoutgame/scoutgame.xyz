'use client';

import { LoadingButton } from '@mui/lab';
import { getCurrentWeek } from '@packages/dates/utils';
import { addMatchupSelectionAction } from '@packages/matchup/addMatchupSelectionAction';
import { removeMatchupSelectionAction } from '@packages/matchup/removeMatchupSelectionAction';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';

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
  const { execute: executeRemove, isExecuting: isExecutingRemove } = useAction(removeMatchupSelectionAction);
  const { execute: executeAdd, isExecuting: isExecutingAdd } = useAction(addMatchupSelectionAction);

  // keep an internal state to avoid flickering when the button is clicked
  const [_isSelected, setIsSelected] = useState(isSelected);

  async function handleAddMatchupSelection() {
    if (isSelected) {
      await executeRemove({
        matchupId,
        developerId: builder.id
      });
    } else {
      await executeAdd({
        matchupId,
        developerId: builder.id
      });
    }
    setIsSelected(!isSelected);
  }

  useEffect(() => {
    setIsSelected(isSelected);
  }, [isSelected]);

  return (
    <LoadingButton fullWidth loading={isExecutingRemove || isExecutingAdd} onClick={handleAddMatchupSelection}>
      {_isSelected ? 'Selected' : 'Select'}
    </LoadingButton>
  );
}
