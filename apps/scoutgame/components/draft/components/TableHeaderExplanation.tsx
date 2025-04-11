'use client';

import { Stack, Typography } from '@mui/material';

type ExplanationItemProps = {
  title: string;
  description: string;
};

function ExplanationItem({ title, description }: ExplanationItemProps) {
  return (
    <Stack>
      <Typography color='secondary' variant='subtitle1' fontWeight={600}>
        {title}
      </Typography>
      <Typography>{description}</Typography>
    </Stack>
  );
}

export function TableHeaderExplanation() {
  return (
    <Stack
      sx={{
        bgcolor: '#1B2653',
        px: 4,
        py: 2,
        gap: 2
      }}
    >
      <ExplanationItem title='POINTS' description='Total # of points earned last season.' />

      <ExplanationItem
        title='LEVEL'
        description="Represents the percentile of the Developer's weekly Scout Point average relative to that of all active developers from last season. The top 10% of Developers are Level 10."
      />

      <ExplanationItem
        title='WEEKLY RANK'
        description='Last season’s rank history for the weekly Gem competition. Better rank equals more rewards! Vertical axis max is rank 1 and min is rank 100. Benchmark is set at rank = 50.'
      />
    </Stack>
  );
}
