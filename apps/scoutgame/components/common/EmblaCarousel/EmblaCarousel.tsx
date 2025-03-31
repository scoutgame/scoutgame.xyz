import { Box, Stack, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { EmblaOptionsType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import type { ReactNode } from 'react';

import { PrevButton, NextButton, usePrevNextButtons } from './EmblaCarouselArrowButtons';
import { DotButton, useDotButton } from './EmblaCarouselDotButton';

type PropType = {
  slides: ReactNode[];
  options?: EmblaOptionsType;
};

const Embla = styled('div')`
  max-width: 48rem;
  margin: auto;
  --slide-height: 19rem;
  --slide-spacing: 1rem;
  --slide-size: 100%;
`;

const EmblaViewport = styled('div')`
  overflow: hidden;
`;

const EmblaContainer = styled('div')`
  display: flex;
  touch-action: pan-y pinch-zoom;
  margin-left: calc(var(--slide-spacing) * -1);
`;

const EmblaSlide = styled('div')`
  transform: translate3d(0, 0, 0);
  flex: 0 0 var(--slide-size);
  min-width: 0;
  padding-left: var(--slide-spacing);
`;

export function EmblaCarousel({ slides, options }: PropType) {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi);

  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } = usePrevNextButtons(emblaApi);

  return (
    <Embla>
      <EmblaViewport ref={emblaRef}>
        <EmblaContainer>
          {slides.map((slide, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <EmblaSlide key={index}>{slide}</EmblaSlide>
          ))}
        </EmblaContainer>
      </EmblaViewport>

      <Stack direction='row' alignItems='center' justifyContent='center'>
        <div>
          <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
        </div>
        <Stack direction='row' justifyContent='center'>
          {scrollSnaps.map((_, index) => (
            <DotButton
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              onClick={() => onDotButtonClick(index)}
              className={'embla__dot'.concat(index === selectedIndex ? ' embla__dot--selected' : '')}
            />
          ))}
        </Stack>
        <div>
          <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
        </div>
      </Stack>
    </Embla>
  );
}
