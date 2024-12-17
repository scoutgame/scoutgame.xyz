'use client';

import { Box, Paper, Stack, Typography } from '@mui/material';
import { getEditorialDescription } from '@packages/scoutgame/builderNfts/builderRegistration/starterPack/starterPackBuilders';
import type { StarterPackBuilder } from '@packages/scoutgame/builders/getStarterPackBuilders';

import { useLgScreen, useMdScreen } from '../../../hooks/useMediaScreens';
import { BuilderCard } from '../../common/Card/BuilderCard/BuilderCard';
import { Carousel } from '../../common/Carousel/Carousel';
import { StarterPackInfo } from '../StarterPackCarousel/StarterPackInfo';

import 'swiper/css';
import 'swiper/css/autoplay';

export function StarterPackCarousel({
  builders,
  remainingStarterCards
}: {
  builders: StarterPackBuilder[];
  remainingStarterCards: number;
}) {
  const isDesktop = useMdScreen();
  const isLgScreen = useLgScreen();
  const size = isLgScreen ? 'large' : isDesktop ? 'small' : 'x-small';

  return (
    <Stack gap={4} flexDirection={{ xs: 'column-reverse', md: 'row' }}>
      <Carousel
        slidesPerView={1}
        autoplay={false}
        boxProps={{ width: { xs: '100%', md: '70%' }, margin: '0 auto' }}
        navigation={{
          nextEl: '.swiper-starter-pack-button-next',
          prevEl: '.swiper-starter-pack-button-prev'
        }}
        mobileMinHeight='400px'
        showMobileNavigationArrows
      >
        {builders.map((builder) => (
          <Stack
            key={builder.id}
            flexDirection='row'
            component={Paper}
            gap={2}
            p={{ xs: 2, md: 4 }}
            bgcolor='transparent'
            border='1px solid'
            borderColor='green.main'
          >
            <Box>
              <BuilderCard
                builder={builder}
                showPurchaseButton
                markStarterCardPurchased={builder.purchased}
                type='starter_pack'
                size={size}
              />
            </Box>
            <Box display='flex' alignItems='center' flexWrap='wrap' component={Paper} p={1}>
              <Typography width='fit-container' fontSize={{ xs: '0.8rem', md: '1rem' }}>
                {getEditorialDescription({ fid: builder.farcasterId }) ?? builder.bio}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Carousel>
      <StarterPackInfo remainingStarterCards={remainingStarterCards} />
    </Stack>
  );
}
