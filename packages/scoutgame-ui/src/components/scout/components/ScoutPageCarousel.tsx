import { Box, Typography } from '@mui/material';
import type { StarterPackBuilder } from '@packages/scoutgame/builders/getStarterPackBuilders';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { StarterPackCarousel } from '../StarterPackCarousel/StarterPackCarousel';
import { BuildersCarousel } from '../TodaysHotBuildersCarousel/BuildersCarousel';

const CAROUSEL_CONFIG = {
  starter: {
    title: 'Scout a Starter Card!',
    color: 'green.main'
  },
  default: {
    title: "Scout today's HOT Developers!",
    color: 'secondary'
  }
};
export function ScoutPageCarousel({
  builders,
  starterCardDevs,
  nftType
}: {
  builders: BuilderInfo[];
  starterCardDevs: StarterPackBuilder[];
  nftType: 'default' | 'starter';
}) {
  const tabConfig = CAROUSEL_CONFIG[nftType];

  return (
    <Box position='relative' mb={3}>
      <Typography variant='h5' color={tabConfig.color} textAlign='center' fontWeight='bold' mb={2} mt={2}>
        {tabConfig.title}
      </Typography>
      {nftType === 'starter' ? (
        <StarterPackCarousel builders={starterCardDevs} />
      ) : (
        <BuildersCarousel builders={builders} showPromoCards />
      )}
    </Box>
  );
}
