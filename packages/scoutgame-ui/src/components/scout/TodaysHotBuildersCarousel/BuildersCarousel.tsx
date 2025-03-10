'use client';

import { useTheme } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { useLgScreen, useMdScreen } from '../../../hooks/useMediaScreens';
import { useTrackEvent } from '../../../hooks/useTrackEvent';
import { BuilderCard } from '../../common/Card/BuilderCard/BuilderCard';
import { Carousel } from '../../common/Carousel/Carousel';

import { PromoCard } from './PromoCard';

const promoInsertIndex = 2;

export function BuildersCarousel({
  builders,
  showPromoCards = false
}: {
  builders: BuilderInfo[];
  showPromoCards?: boolean;
}) {
  const theme = useTheme();
  const breakpointsValues = theme.breakpoints.values;
  const isDesktop = useMdScreen();
  const isLgScreen = useLgScreen();
  const trackEvent = useTrackEvent();
  const size = isLgScreen ? 'large' : isDesktop ? 'small' : 'x-small';

  const builderCardsList = builders.map((builder) => (
    <BuilderCard size={size} type={builder.nftType} key={builder.id} builder={builder} showPurchaseButton />
  ));

  const builderCards = showPromoCards
    ? [
        <PromoCard
          data-test='promo-card-optimism'
          key='op-new-scout-ad'
          size={size}
          path='/info/partner-rewards/optimism'
          src='/images/home/op-new-scout-ad.png'
          onClick={() => {
            trackEvent('click_optimism_promo');
          }}
        />,
        ...builderCardsList.slice(0, promoInsertIndex),
        // <PromoCard
        //   data-test='promo-card-moxie'
        //   key='moxie-fan-reward-ad'
        //   size={size}
        //   path='/info/partner-rewards/moxie'
        //   src='/images/home/moxie-fan-reward-ad.png'
        //   onClick={() => {
        //     trackEvent('click_moxie_promo');
        //   }}
        // />,
        ...builderCardsList.slice(promoInsertIndex, promoInsertIndex * 2),
        ...builderCardsList.slice(promoInsertIndex * 2)
      ]
    : builderCardsList;

  return (
    <Carousel
      slidesPerView={3}
      slotProps={{ boxProps: { width: { xs: '100%', md: '90%' }, margin: '0 auto' } }}
      autoplay
      breakpoints={{
        [breakpointsValues.xs]: {
          slidesPerView: 2.2
        },
        [breakpointsValues.md]: {
          slidesPerView: 3
        }
      }}
    >
      {builderCards}
    </Carousel>
  );
}
