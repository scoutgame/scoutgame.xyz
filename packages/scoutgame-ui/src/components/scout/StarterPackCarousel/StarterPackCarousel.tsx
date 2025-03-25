import { Stack, useTheme } from '@mui/material';
import type { StarterPackBuilder } from '@packages/scoutgame/builders/getStarterPackBuilders';

import { BuilderCard } from '../../common/Card/BuilderCard/BuilderCard';
import { Carousel } from '../../common/Carousel/Carousel';

import { StarterPackCard } from './StarterPackCard';
import { StarterPackInfo } from './StarterPackInfo';

export function StarterPackCarousel({ builders }: { builders: StarterPackBuilder[] }) {
  // const theme = useTheme();
  // const breakpointsValues = theme.breakpoints.values;
  const cards = builders.map(({ builder, hasPurchased }) => (
    <BuilderCard
      type={builder.nftType}
      key={builder.id}
      builder={builder}
      showPurchaseButton
      markStarterCardPurchased={hasPurchased}
    />
  ));
  return (
    <Stack gap={{ xs: 2, md: 4 }} flexDirection={{ xs: 'column-reverse', md: 'row' }} ml={{ md: 2 }}>
      <Carousel
        slidesPerView={2}
        // navigation={{
        //   nextEl: '.swiper-starter-pack-button-next',
        //   prevEl: '.swiper-starter-pack-button-prev'
        // }}
        autoplay
        slotProps={{
          arrowProps: {
            sx: {
              display: 'flex',
              bgcolor: { xs: 'transparent', md: 'background.paper' },
              '&:hover': {
                bgcolor: { xs: 'transparent', md: 'background.paper' }
              }
            }
          },
          boxProps: { width: { xs: '100%', md: '70%' }, margin: '0 auto' }
        }}
        // breakpoints={{
        //   [breakpointsValues.xs]: {
        //     slidesPerView: 2.2
        //   },
        //   [breakpointsValues.md]: {
        //     slidesPerView: 3
        //   }
        // }}
      >
        {cards}
      </Carousel>
      <StarterPackInfo />
    </Stack>
  );
}
