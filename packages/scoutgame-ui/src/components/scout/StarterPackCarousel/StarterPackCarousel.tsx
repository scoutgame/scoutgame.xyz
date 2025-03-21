import { Stack } from '@mui/material';
import type { StarterPackBuilder } from '@packages/scoutgame/builders/getStarterPackBuilders';

import { Carousel } from '../../common/Carousel/Carousel';

import { StarterPackCard } from './StarterPackCard';
import { StarterPackInfo } from './StarterPackInfo';

export function StarterPackCarousel({ builders }: { builders: StarterPackBuilder[] }) {
  return (
    <Stack gap={{ xs: 2, md: 4 }} flexDirection={{ xs: 'column-reverse', md: 'row' }} ml={{ md: 2 }}>
      <Carousel
        slidesPerView={1}
        navigation={{
          nextEl: '.swiper-starter-pack-button-next',
          prevEl: '.swiper-starter-pack-button-prev'
        }}
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
      >
        {builders.map(({ builder, hasPurchased }) => (
          <StarterPackCard key={builder.id} builder={builder} hasPurchased={hasPurchased} />
        ))}
      </Carousel>
      <StarterPackInfo />
    </Stack>
  );
}
