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
  tab,
  scoutId
}: {
  builders: BuilderInfo[];
  starterPackBuilders: StarterPackBuilder[];
  remainingStarterCards: number;
  tab: string;
  scoutId?: string;
}) {
  const isStarterPackEnabled = starterPackBuilders.length > 0 && scoutId;
  const nextTab = tab === 'starter_pack' ? 'top_builders' : 'starter_pack';
  const text = tab === 'starter_pack' && isStarterPackEnabled ? 'Top Builders' : 'Starter Pack';
  const title =
    tab === 'starter_pack' && isStarterPackEnabled ? 'Scout the Starter Pack!' : "Scout today's HOT Builders!";
  const color = tab === 'starter_pack' && isStarterPackEnabled ? 'green.main' : 'secondary';

  return (
    <Box position='relative'>
      {isStarterPackEnabled && (
        <Box width='100%' display='flex' justifyContent='flex-end'>
          <Box
            data-test='carousel-tab-switch'
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
