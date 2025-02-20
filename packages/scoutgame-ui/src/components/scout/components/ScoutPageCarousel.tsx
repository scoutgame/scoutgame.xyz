'use client';

import { Box, Button, Typography } from '@mui/material';
import type { StarterPackBuilder } from '@packages/scoutgame/builders/getStarterPackBuilders';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { useState } from 'react';

import { StarterPackCarousel } from '../StarterPackCarousel/StarterPackCarousel';
import { BuildersCarousel } from '../TodaysHotBuildersCarousel/BuildersCarousel';

export function ScoutPageCarousel({
  builders,
  starterPackBuilders,
  remainingStarterCards,
  scoutId
}: {
  builders: BuilderInfo[];
  starterPackBuilders: StarterPackBuilder[];
  remainingStarterCards: number;
  scoutId?: string;
}) {
  const [tab, setTab] = useState<'top_builders' | 'starter_pack'>('starter_pack');

  const isStarterPackEnabled = starterPackBuilders.length > 0 && scoutId;
  const nextTab = tab === 'starter_pack' ? 'top_builders' : 'starter_pack';
  const text = tab === 'starter_pack' && isStarterPackEnabled ? 'Top Developers' : 'Starter Pack';
  const title =
    tab === 'starter_pack' && isStarterPackEnabled ? 'Scout the Starter Pack!' : "Scout today's HOT Developers!";
  const color = tab === 'starter_pack' && isStarterPackEnabled ? 'green.main' : 'secondary';

  const handleTabSwitch = () => setTab(nextTab);
  return (
    <Box position='relative' mb={3}>
      {isStarterPackEnabled && (
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
            {text}
          </Button>
        </Box>
      )}
      <Typography variant='h5' color={color} textAlign='center' fontWeight='bold' mb={2} mt={2}>
        {title}
      </Typography>
      {tab === 'starter_pack' && isStarterPackEnabled ? (
        <StarterPackCarousel builders={starterPackBuilders} remainingStarterCards={remainingStarterCards} />
      ) : (
        <BuildersCarousel builders={builders} showPromoCards />
      )}
    </Box>
  );
}
