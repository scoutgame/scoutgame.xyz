'use client';

import type { BoxProps, IconButtonProps } from '@mui/material';
import { Box, styled } from '@mui/material';
import type { ReactNode, ComponentProps } from 'react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { NavigationOptions } from 'swiper/types';

import { useIsMounted } from '../../../hooks/useIsMounted';

import { NextArrow, PrevArrow } from './Arrows';

import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/pagination';

const StyledSwiper = styled(Swiper)();

export type CarouselProps = {
  children: ReactNode[];
  slidesPerView?: number;
  slotProps: {
    boxProps?: Partial<BoxProps>;
    arrowProps?: Partial<IconButtonProps>;
  };
} & ComponentProps<typeof StyledSwiper>;

export function Carousel({ children, slotProps, autoplay, ...swiperProps }: CarouselProps) {
  const { boxProps, arrowProps } = slotProps;
  // Use state and effect to skip pre-rendering
  const isMounted = useIsMounted();

  const prevButtonId =
    ((swiperProps.navigation as NavigationOptions)?.prevEl as string | undefined) ?? '.swiper-button-prev';
  const nextButtonId = (swiperProps.navigation as NavigationOptions)?.nextEl ?? '.swiper-button-next';

  if (!isMounted) {
    return <Box mb={2} mx='auto' px={{ md: 4 }} {...boxProps} />;
  }

  return (
    <Box
      display='flex'
      alignItems='center'
      justifyContent='center'
      mb={2}
      mx='auto'
      px={{ md: 4 }}
      position='relative'
      {...boxProps}
    >
      <StyledSwiper
        autoplay={
          typeof autoplay === 'boolean' && autoplay === true
            ? {
                delay: 3000,
                pauseOnMouseEnter: true
              }
            : autoplay || undefined
        }
        loop
        className='swiper'
        autoHeight={true}
        modules={[Navigation, Autoplay, Pagination]}
        navigation={{
          nextEl: nextButtonId,
          prevEl: prevButtonId
        }}
        {...swiperProps}
        sx={{
          width: '100%',
          zIndex: 0,
          ...swiperProps.sx
        }}
      >
        {children.map((child, index) => (
          <SwiperSlide key={`${index.toString()}`}>{child}</SwiperSlide>
        ))}
      </StyledSwiper>
      {swiperProps.slidesPerView && children.length > swiperProps.slidesPerView && (
        <>
          <NextArrow className={(nextButtonId as string).replace('.', '')} {...arrowProps} />
          <PrevArrow className={(prevButtonId as string).replace('.', '')} {...arrowProps} />
        </>
      )}
    </Box>
  );
}
