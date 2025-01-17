import { Stack } from '@mui/material';

import { BuilderCardActivity } from './BuilderCardActivity/BuilderCardActivity';
import { BuilderCardName } from './BuilderCardName';

export function BuilderCardStats({
  displayName,
  last14DaysRank,
  size,
  gemsCollected,
  estimatedPayout,
  starterPack
}: {
  gemsCollected?: number;
  displayName: string;
  last14DaysRank?: (number | null)[] | null;
  size: 'x-small' | 'small' | 'medium' | 'large';
  estimatedPayout?: number | null;
  starterPack?: boolean;
}) {
  return (
    <Stack height='100%'>
      <BuilderCardActivity
        size={size}
        last14DaysRank={last14DaysRank ?? []}
        estimatedPayout={estimatedPayout ?? 0}
        gemsCollected={gemsCollected ?? 0}
      />
      <BuilderCardName name={displayName} size={size} starterPack={starterPack} />
    </Stack>
  );
}
