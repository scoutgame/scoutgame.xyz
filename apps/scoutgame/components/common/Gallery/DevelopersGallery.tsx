import { Box, Grid2 as Grid, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import type { ReactNode, ComponentType } from 'react';

import { BuilderCard } from '../Card/BuilderCard/BuilderCard';

export function DevelopersGallery({
  builders,
  columns = 6,
  size = 'medium',
  markStarterCardPurchased = false,
  showListButton = false,
  scoutInView,
  actionSlot,
  actionSlotProps,
  cardVariant,
  firstItem
}: {
  scoutInView?: string;
  builders: BuilderInfo[];
  columns?: number;
  size?: 'small' | 'medium' | 'large';
  markStarterCardPurchased?: boolean;
  showListButton?: boolean;
  actionSlot?: ComponentType<any>;
  actionSlotProps?: Record<string, any>;
  cardVariant?: 'matchup_selection';
  firstItem?: ReactNode;
}) {
  return (
    <Box flexGrow={1}>
      <Grid
        container
        rowSpacing={2}
        columns={{ xs: 2, sm: 3, md: builders.length < columns ? builders.length : columns }}
      >
        {firstItem && <Grid size={{ xs: 1 }}>{firstItem}</Grid>}
        {builders.map((builder) => (
          <Grid key={builder.path} size={{ xs: 1 }} display='flex' justifyContent='center' alignItems='flex-start'>
            <Box position='relative'>
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
                variant={cardVariant}
                sx={{
                  boxShadow: '3px -3px 4px #000'
                }}
              />
              {builder.showAdditionalStarterCard && (
                <Box position='absolute' top={-7} left={7} zIndex={1}>
                  <BuilderCard
                    builder={{
                      ...builder,
                      nftType: 'starter_pack',
                      nftImageUrl: builder.starterCardImage
                    }}
                    size={size}
                    type='starter_pack'
                    variant={cardVariant}
                    actionSlot={actionSlot}
                    actionSlotProps={actionSlotProps}
                  />
                </Box>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
