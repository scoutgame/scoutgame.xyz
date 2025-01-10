import { Stack, Typography } from '@mui/material';

import { BuilderCardActivity } from './BuilderCardActivity/BuilderCardActivity';
import { BuilderCardName } from './BuilderCardName';

export function BuilderCardStats({
  displayName,
  last14DaysRank,
  size,
  weeksGems,
  estimatePayout
}: {
  weeksGems?: number;
  displayName: string;
  last14DaysRank?: number[];
  size: 'x-small' | 'small' | 'medium' | 'large';
  estimatePayout?: number;
}) {
  return (
    <Stack
      pt={0.25}
      sx={{
        borderWidth: '1.5px 0px 1.5px 0px',
        borderStyle: 'solid',
        borderColor: '#A06CD5'
      }}
      height='100%'
    >
      <Typography
        sx={{
          pl: 0.25,
          fontWeight: 500,
          alignSelf: 'flex-start',
          color: 'text.secondary',
          fontSize: {
            xs: '7.5px',
            md: size === 'medium' || size === 'large' ? '10px' : '8px'
          }
        }}
      >
        14 DAY ACTIVITY
      </Typography>
      <BuilderCardActivity
        size={size}
        last14DaysRank={last14DaysRank ?? []}
        estimatePayout={estimatePayout ?? 0}
        weeksGems={weeksGems ?? 0}
      />
      <BuilderCardName name={displayName} size={size} />
    </Stack>
  );
}
