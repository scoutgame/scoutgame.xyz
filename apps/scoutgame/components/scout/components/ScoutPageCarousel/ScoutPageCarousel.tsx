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
    title: 'Full Power with Standard Cards!',
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
            <Box maxWidth='25em' margin='0 auto'>
              <Typography align='center' gutterBottom>
                A Starter Developer Card costs only 100 DEV Tokens for 1/10 the rewards of a Standard Developer Card.
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
            <Typography align='center' gutterBottom>
              Earn DEV Tokens by purchasing Developer Cards.
              <br />
              When your Developer contributes, both of you will be rewarded!
            </Typography>
          }
        />
      )}
    </Box>
  );
}
