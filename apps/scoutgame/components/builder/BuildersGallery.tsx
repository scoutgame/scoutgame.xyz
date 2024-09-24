import 'server-only';

import { Box, Grid2 as Grid } from '@mui/material';

import type { BuilderInfo } from './Card/BuilderCard';
import { BuilderCard } from './Card/BuilderCard';

export async function BuildersGallery({ builders }: { builders: BuilderInfo[] }) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={{ xs: 1, sm: 2 }} columns={{ xs: 3, sm: 6, md: 12, lg: 12 }}>
        {builders.map((builder) => (
          <Grid key={builder.username} size={{ xs: 1, sm: 2, md: 3, lg: 2 }}>
            <BuilderCard builder={builder} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
