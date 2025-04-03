import { styled } from '@mui/material/styles';
import type { EmblaCarouselType } from 'embla-carousel';
import { useCallback, useEffect, useState } from 'react';

export const DotButton = styled('div')`
  -webkit-tap-highlight-color: rgba(var(--mui-palette-secondary-mainChannel), 0.5);
  -webkit-appearance: none;
  appearance: none;
  background-color: transparent;
  touch-action: manipulation;
  display: inline-flex;
  text-decoration: none;
  cursor: pointer;
  border: 0;
  padding: 0;
  margin: 0;
  width: calc(4 * var(--mui-spacing));
  height: calc(4 * var(--mui-spacing));
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;

  &:after {
    box-shadow: inset 0 0 0 0.1rem var(--mui-palette-secondary-main);
    width: 14px;
    height: 14px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    content: '';
  }

  &.embla__dot--selected:after {
    background-color: var(--mui-palette-secondary-main);
  }
`;

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
