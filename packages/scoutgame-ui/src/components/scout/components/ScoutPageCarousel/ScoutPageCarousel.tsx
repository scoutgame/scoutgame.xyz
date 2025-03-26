import { Box, Typography } from '@mui/material';
import type { StarterCardDeveloper } from '@packages/scoutgame/builders/getStarterCardDevelopers';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { DevelopersCarousel } from './components/DevelopersCarousel';

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
  starterCardDevs: StarterCardDeveloper[];
  nftType: 'default' | 'starter';
}) {
  const tabConfig = CAROUSEL_CONFIG[nftType];

  return (
    <Box position='relative' mb={3}>
      <Typography variant='h5' color={tabConfig.color} textAlign='center' fontWeight='bold' mb={2} mt={2}>
        {tabConfig.title}
      </Typography>
      {nftType === 'starter' ? (
        <DevelopersCarousel
          developers={starterCardDevs}
          infoCard={
            <Box display='flex' flexDirection='column' gap={2}>
              <Typography variant='h6' fontWeight={600} textAlign={{ xs: 'center', md: 'left' }} color='green.main'>
                Earn Scout Points
              </Typography>
              <Typography>Start your collection by purchasing a Starter Card!</Typography>
              <Typography>
                Starter Cards cost only 20 Scout Points, up to 95% off from regular Developer Cards!
              </Typography>
              <Typography variant='caption'>
                <sup>*</sup>Starter Cards earn 1/10 Scout Points compared to regular Developer Cards.
              </Typography>
            </Box>
          }
        />
      ) : (
        <DevelopersCarousel
          developers={builders.map((builder) => ({
            builder
          }))}
          infoCard={
            <Box display='flex' flexDirection='column' gap={2}>
              <Typography variant='h6' fontWeight={600} textAlign={{ xs: 'center', md: 'left' }} color='green.main'>
                Earn Scout Points
              </Typography>
              <Typography>Start your collection by purchasing a Developer Card!</Typography>
            </Box>
          }
        />
      )}
    </Box>
  );
}
