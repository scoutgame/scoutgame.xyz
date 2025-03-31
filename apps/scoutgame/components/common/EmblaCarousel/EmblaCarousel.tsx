import { Box, Stack, Typography, Button } from '@mui/material';
import type { EmblaOptionsType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { PrevButton, NextButton, usePrevNextButtons } from './EmblaCarouselArrowButtons';
import { DotButton, useDotButton } from './EmblaCarouselDotButton';

type PropType = {
  slides: ReactNode[];
  options?: EmblaOptionsType;
};

export function EmblaCarousel({ slides, options }: PropType) {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi);

  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } = usePrevNextButtons(emblaApi);

  return (
    <section className='embla'>
      <div className='embla__viewport' ref={emblaRef}>
        <div className='embla__container'>
          {slides.map((slide, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div className='embla__slide' key={index}>
              {slide}
            </div>
          ))}
        </div>
      </div>

      <Stack direction='row' width='100%'>
        <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
        <Stack direction='row' flexGrow={1} justifyContent='center'>
          {scrollSnaps.map((_, index) => (
            <DotButton
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              onClick={() => onDotButtonClick(index)}
              className={'embla__dot'.concat(index === selectedIndex ? ' embla__dot--selected' : '')}
            />
          ))}
        </Stack>
        <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
      </Stack>
    </section>
  );
}
