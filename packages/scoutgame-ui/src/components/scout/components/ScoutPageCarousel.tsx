import { Box, Typography } from '@mui/material';
import type { StarterPackBuilder } from '@packages/scoutgame/builders/getStarterPackBuilders';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import Link from 'next/link';

import { StarterPackCarousel } from '../StarterPackCarousel/StarterPackCarousel';
import { BuildersCarousel } from '../TodaysHotBuildersCarousel/BuildersCarousel';

export function ScoutPageCarousel({
  builders,
  starterPackBuilders,
  remainingStarterCards,
  tab
}: {
  builders: BuilderInfo[];
  starterPackBuilders: StarterPackBuilder[];
  remainingStarterCards: number;
  tab: string;
}) {
  const isStarterPackEnabled = starterPackBuilders.length > 0;
  const nextTab = tab === 'top_builders' && isStarterPackEnabled ? 'starter_pack' : 'top_builders';
  const text = tab === 'starter_pack' ? 'Top Builders' : 'Starter Pack';
  const title = tab === 'starter_pack' ? 'Scout the Starter Pack!' : "Scout today's HOT Builders!";
  const color = tab === 'starter_pack' ? 'green.main' : 'secondary';

  return (
    <Box position='relative'>
      <Box width='100%' display='flex' justifyContent='flex-end'>
        <Box
          component={Link}
          href={{ query: { carousel: nextTab } }}
          replace={true}
          prefetch={false}
          shallow={true}
          sx={{ position: { md: 'absolute' }, right: 0, top: 18 }}
        >
          <Typography component='span' sx={{ textDecoration: 'underline' }}>
            {text}
          </Typography>
        </Box>
      </Box>
      <Typography variant='h5' color={color} textAlign='center' fontWeight='bold' mb={2} mt={2}>
        {title}
      </Typography>
      {tab === 'starter_pack' ? (
        <StarterPackCarousel builders={starterPackBuilders} remainingStarterCards={remainingStarterCards} />
      ) : (
        <BuildersCarousel builders={builders} showPromoCards />
      )}
    </Box>
  );
}
