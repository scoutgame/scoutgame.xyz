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
  const size = isLgScreen ? 'large' : isDesktop ? 'small' : 'small';

  return (
    <Stack gap={4} flexDirection={{ xs: 'column-reverse', md: 'row' }}>
      <Carousel
        slidesPerView={1}
        autoplay
        navigation={{
          nextEl: '.swiper-starter-pack-button-next',
          prevEl: '.swiper-starter-pack-button-prev'
        }}
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
        {builders.map((builder) => (
          <Stack
            key={builder.id}
            flexDirection={{ xs: 'column', md: 'row' }}
            component={Paper}
            gap={2}
            p={{ xs: 2, md: 4 }}
            bgcolor='transparent'
            border='1px solid'
            borderColor='green.main'
            sx={{
              backgroundImage: `url(/images/backgrounds/star-bg.jpg)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
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
              <Typography width='fit-container' variant='body2'>
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
