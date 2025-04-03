import { Box, Grid2 as Grid, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import type { ComponentType } from 'react';

import { BuilderCard } from '../Card/BuilderCard/BuilderCard';

export function BuildersGallery({
  builders,
  columns = 6,
  size = 'medium',
  markStarterCardPurchased = false,
  showListButton = false,
  scoutInView,
  actionSlot,
  actionSlotProps
}: {
  scoutInView?: string;
  builders: BuilderInfo[];
  columns?: number;
  size?: 'small' | 'medium' | 'large';
  markStarterCardPurchased?: boolean;
  showListButton?: boolean;
  actionSlot?: ComponentType<any>;
  actionSlotProps?: Record<string, any>;
}) {
  return (
    <Box flexGrow={1}>
      <Grid
        container
        rowSpacing={2}
        columns={{ xs: 2, sm: 3, md: builders.length < columns ? builders.length : columns }}
      >
        {builders.map((builder) => (
          <Grid key={builder.path} size={{ xs: 1 }} display='flex' justifyContent='center' alignItems='flex-start'>
            <Box>
              {builder.nftsSoldToScoutInView !== undefined && builder.nftsSoldToScoutInView > 0 && (
                <Typography color='green.main' textAlign='right' mb={1}>
                  X {builder.nftsSoldToScoutInView}
                </Typography>
              )}
              <BuilderCard
                scoutInView={scoutInView}
                builder={builder}
                showPurchaseButton
                size={size}
                type={builder.nftType}
                markStarterCardPurchased={markStarterCardPurchased}
                showListButton={showListButton}
                actionSlot={actionSlot}
                actionSlotProps={actionSlotProps}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
