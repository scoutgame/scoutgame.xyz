import { Box } from '@mui/material';
import type { EmblaCarouselType } from 'embla-carousel';
import type { ComponentPropsWithRef } from 'react';
import React, { useCallback, useEffect, useState } from 'react';

type UseDotButtonType = {
  selectedIndex: number;
  scrollSnaps: number[];
  onDotButtonClick: (index: number) => void;
};

export function useDotButton(emblaApi: EmblaCarouselType | undefined): UseDotButtonType {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onDotButtonClick = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onInit = useCallback((_emblaApi: EmblaCarouselType) => {
    setScrollSnaps(_emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((_emblaApi: EmblaCarouselType) => {
    setSelectedIndex(_emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on('reInit', onInit).on('reInit', onSelect).on('select', onSelect);
  }, [emblaApi, onInit, onSelect]);

  return {
    selectedIndex,
    scrollSnaps,
    onDotButtonClick
  };
}

type PropType = { onClick: () => void; className: string };

export function DotButton(props: PropType) {
  return <Box {...props} />;
}
