import { Stack, Typography } from '@mui/material';

import { BuilderCardRankGraph } from '../Card/BuilderCard/BuilderCardActivity/BuilderCardRankGraph';

export function DeveloperInfoRanksGraph({ ranks, label }: { ranks: (number | null)[]; label: string }) {
  return (
    <Stack
      bgcolor='background.dark'
      borderRadius={1}
      flex={1}
      height={{
        xs: 115,
        md: 140
      }}
    >
      <Typography
        color='secondary.main'
        p={{
          xs: 0.5,
          md: 1
        }}
      >
        {label}
      </Typography>
      <Stack height='calc(100% - 16px)'>
        <BuilderCardRankGraph ranks={ranks} />
      </Stack>
    </Stack>
  );
}
