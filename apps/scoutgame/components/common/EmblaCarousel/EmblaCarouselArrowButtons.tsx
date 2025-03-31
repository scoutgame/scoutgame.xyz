import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { Box, Card, CardContent, MobileStepper, Stack, Typography, Button } from '@mui/material';
import type { EmblaCarouselType } from 'embla-carousel';
import type { ComponentPropsWithRef } from 'react';
import React, { useCallback, useEffect, useState } from 'react';

type UsePrevNextButtonsType = {
  prevBtnDisabled: boolean;
  nextBtnDisabled: boolean;
  onPrevButtonClick: () => void;
  onNextButtonClick: () => void;
};

export function usePrevNextButtons(emblaApi: EmblaCarouselType | undefined): UsePrevNextButtonsType {
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const onPrevButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
  }, [emblaApi]);

  const onNextButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback((_emblaApi: EmblaCarouselType) => {
    setPrevBtnDisabled(!_emblaApi.canScrollPrev());
    setNextBtnDisabled(!_emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on('reInit', onSelect).on('select', onSelect);
  }, [emblaApi, onSelect]);

  return {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick
  };
}

type PropType = { disabled?: boolean; onClick: () => void };

export function PrevButton(props: PropType) {
  const { ...restProps } = props;

  return (
    <Button size='small' variant='text' color='secondary' sx={{ pr: 2 }} {...restProps}>
      <KeyboardArrowLeft />
      back
    </Button>
  );
}

export function NextButton(props: PropType) {
  const { ...restProps } = props;

  return (
    <Button size='small' variant='text' color='secondary' sx={{ pl: 2 }} {...restProps}>
      next
      <KeyboardArrowRight />
    </Button>
  );
}
