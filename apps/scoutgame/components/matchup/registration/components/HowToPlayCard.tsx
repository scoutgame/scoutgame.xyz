'use client';

import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { Box, Card, CardContent, MobileStepper, Stack, Typography, Button } from '@mui/material';
import { Carousel } from '@packages/scoutgame-ui/components/common/Carousel/Carousel';
import { PointsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { EmblaCarousel } from 'components/common/EmblaCarousel/EmblaCarousel';

type SlideContent = {
  subtitle: string;
  iconSrc: string;
  text: ReactNode;
};

const slides: SlideContent[] = [
  {
    subtitle: '1. Register',
    iconSrc: '/images/matchup/howtoplay_open.svg',
    text: (
      <Typography variant='body2'>
        Kick things off by registering! Pay the 50 Scout Point entry fee before 11:59 PM Monday UTC to join this week’s
        action.
      </Typography>
    )
  },
  {
    subtitle: '2. Builder Your Dream  Team',
    iconSrc: '/images/matchup/howtoplay_magnifier.svg',
    text: (
      <Typography variant='body2'>
        With 35 Credits in your budget, pick 5 developers from your deck. A developer’s cost in credits is equal to
        their Level. The goal? Assemble a squad that’ll rack up the most Gems by contributing to open source projects.
      </Typography>
    )
  },
  {
    subtitle: '3. Start Collecting Gems',
    iconSrc: '/images/matchup/howtoplay_gem.svg',
    text: (
      <Typography variant='body2'>
        Now the fun begins! Sit back and watch as your team of Dev superstars earns Gems by doing what they do best:
        building cool stuff. The game wraps up at 11:59 PM Sunday UTC, and the teams with the most Gems earn the
        prizes.'
      </Typography>
    )
  },
  {
    subtitle: 'Prizes',
    iconSrc: '/images/matchup/howtoplay_trophy.svg',
    text: (
      <>
        <Typography variant='body2'>Here’s what’s up for grabs every week:</Typography>
        <Typography variant='body2'>🏆 1st Place: 50% of the prize pool + 120</Typography>
        <Typography variant='body2'>🥈 2nd Place: 30% of the prize pool + 50 </Typography>
        <Typography variant='body2' gutterBottom>
          🥉 3rd Place: 20% of the prize pool + 30
        </Typography>
        <Typography variant='body2' align='center' gutterBottom>
          🎟️ 4th Place & 5th Place: FREE ticket for a future match
        </Typography>
        <Typography variant='body2' align='center'>
          Think you’ve got what it takes to build a winning team? Let’s find out!
        </Typography>
      </>
    )
  }
];

export function HowToPlayCard() {
  const [activeStep, setActiveStep] = useState(0);

  const handleStepChange = (step: number) => {
    setActiveStep(step);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  return (
    <Card sx={{ mb: 2, overflow: 'visible', borderColor: 'secondary.main' }}>
      <CardContent>
        <Typography variant='h5' color='secondary' fontWeight={600} sx={{ mb: 2 }}>
          Play Weekly Match Up!
        </Typography>

        <EmblaCarousel
          options={{
            align: 'center',
            slidesToScroll: 1
          }}
          // sx={{
          //   mb: 0,
          //   px: 2,
          //   py: 3
          // }}
          slides={slides.map((slide) => (
            <SlideContent key={slide.subtitle} {...slide} />
          ))}
        />
      </CardContent>
    </Card>
  );
}

function SlideContent({ subtitle, iconSrc, text }: SlideContent) {
  return (
    <Stack flexDirection='row' alignItems='flex-start' gap={2} mb={1}>
      <Box pt={1}>
        <Image src={iconSrc} alt='' width={42} height={42} />
      </Box>
      <Box>
        <Typography variant='subtitle1' color='text.secondary' gutterBottom fontWeight={600} sx={{ mt: 0 }}>
          {subtitle}
        </Typography>
        {text}
      </Box>
    </Stack>
  );
}
