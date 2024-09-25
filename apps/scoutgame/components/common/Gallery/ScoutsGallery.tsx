import { Box, Grid2 as Grid } from '@mui/material';

import type { ScoutInfo } from '../Card/ScoutCard';
import { ScoutCard } from '../Card/ScoutCard';

export function ScoutsGallery({ scouts }: { scouts: ScoutInfo[] }) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={{ xs: 1, sm: 2 }} columns={{ xs: 3, sm: 6, md: 3 }}>
        {scouts.map((scout) => (
          <Grid key={scout.username} size={{ xs: 1 }}>
            <ScoutCard scout={scout} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
