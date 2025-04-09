'use client';

import { Stack, useTheme } from '@mui/material';
import type { StarterCardDeveloper } from '@packages/scoutgame/builders/getStarterCardDevelopers';
import { Carousel } from '@packages/scoutgame-ui/components/common/Carousel/Carousel';
import type { ReactNode } from 'react';

import { BuilderCard } from 'components/common/Card/BuilderCard/BuilderCard';

export function DevelopersCarousel({
  developers,
  infoCard
}: {
  developers: StarterCardDeveloper[];
  infoCard?: ReactNode;
}) {
  const theme = useTheme();
  const breakpointsValues = theme.breakpoints.values;

  // const cardsWithPromos = [
  //   ...developers.slice(0, 2),
  //   // <PromoCard
  //   //   data-test='promo-card-moxie'
  //   //   key='moxie-fan-reward-ad'
  //   //   size={size}
  //   //   path='/info/partner-rewards/moxie'
  //   //   src='/images/home/moxie-fan-reward-ad.png'
  //   //   onClick={() => {
  //   //     trackEvent('click_moxie_promo');
  //   //   }}
  //   // />,
  //   ...developers.slice(2, 4),
  //   ...developers.slice(4)
  // ];

  const cards = developers.map(({ builder, hasPurchased }) => (
    <BuilderCard
      type={builder.nftType}
      key={builder.id}
      builder={builder}
      showPurchaseButton
      markStarterCardPurchased={hasPurchased}
    />
  ));
  return (
    <Stack gap={{ xs: 2 }} flexDirection={{ xs: 'column-reverse' }}>
      <Carousel
        slidesPerView={3}
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
          boxProps: { width: { xs: '100%', md: '90%', margin: '0 auto', px: 2 } }
        }}
        breakpoints={{
          [breakpointsValues.xs]: {
            slidesPerView: 2.2
          },
          [breakpointsValues.md]: {
            slidesPerView: 3
          }
        }}
      >
        {cards}
      </Carousel>
      {infoCard}
    </Stack>
  );
}
