'use client';

import { Box, Button, Typography } from '@mui/material';
import type { StarterPackBuilder } from '@packages/scoutgame/builders/getStarterPackBuilders';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { useState } from 'react';

import { StarterPackCarousel } from '../StarterPackCarousel/StarterPackCarousel';
import { BuildersCarousel } from '../TodaysHotBuildersCarousel/BuildersCarousel';

const CAROUSEL_CONFIG = {
  starter_pack: {
    title: 'Scout a Starter Card!',
    label: 'Starters',
    color: 'green.main'
  },
  top_builders: {
    title: "Scout today's HOT Developers!",
    label: 'Developers',
    color: 'secondary'
  }
};
export function ScoutPageCarousel({
  builders,
  hasPurchasedStarterCard,
  starterCardDevs,
  scoutId
}: {
  builders: BuilderInfo[];
  hasPurchasedStarterCard: boolean;
  starterCardDevs: StarterPackBuilder[];
  scoutId?: string;
}) {
  // If the scout has purchased a starter card, show the top builders carousel
  // Otherwise, show the starter card view unless logged out
  const defaultTab = scoutId ? (hasPurchasedStarterCard ? 'top_builders' : 'starter_pack') : 'starter_pack';
  const [tab, setTab] = useState<'top_builders' | 'starter_pack'>(defaultTab);

  const tabConfig = CAROUSEL_CONFIG[tab];
  const nextTab = tab === 'starter_pack' ? 'top_builders' : 'starter_pack';
  const switchLabel = CAROUSEL_CONFIG[nextTab].label;

  const handleTabSwitch = () => setTab(nextTab);
  return (
    <Box position='relative' mb={3}>
      <Box width='100%' display='flex' justifyContent='flex-end'>
        <Button
          variant='text'
          data-test='carousel-tab-switch'
          onClick={handleTabSwitch}
          sx={{
            position: { md: 'absolute' },
            right: 0,
            top: 18,
            textDecoration: 'underline',
            color: 'text.primary'
          }}
        >
          {switchLabel}
        </Button>
      </Box>
      <Typography variant='h5' color={tabConfig.color} textAlign='center' fontWeight='bold' mb={2} mt={2}>
        {tabConfig.title}
      </Typography>
      {tab === 'starter_pack' ? (
        <StarterPackCarousel builders={starterCardDevs} />
      ) : (
        <BuildersCarousel builders={builders} showPromoCards />
      )}
    </Box>
  );
}
