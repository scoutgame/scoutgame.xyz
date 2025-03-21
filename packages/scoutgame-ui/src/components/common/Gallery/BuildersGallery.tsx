import { Box, Grid2 as Grid, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { BuilderCard } from '../Card/BuilderCard/BuilderCard';

export function BuildersGallery({
  builders,
  columns = 6,
  size = 'medium',
  markStarterCardPurchased = false
}: {
  builders: BuilderInfo[];
  columns?: number;
  size?: 'small' | 'medium' | 'large';
  markStarterCardPurchased?: boolean;
}) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid
        container
        rowSpacing={2}
        columns={{ xs: 2, sm: 3, md: builders.length < columns ? builders.length : columns }}
      >
        {builders.map((builder) => (
          <Grid key={builder.path} size={{ xs: 1 }} display='flex' justifyContent='center' alignItems='center'>
            <Box>
              {builder.nftsSoldToScoutInView !== undefined && builder.nftsSoldToScoutInView > 0 && (
                <Typography color='green.main' textAlign='right' mb={1}>
                  X {builder.nftsSoldToScoutInView}
                </Typography>
              )}
              <BuilderCard
                builder={builder}
                showPurchaseButton
                size={size}
                type={builder.nftType}
                markStarterCardPurchased={markStarterCardPurchased}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
