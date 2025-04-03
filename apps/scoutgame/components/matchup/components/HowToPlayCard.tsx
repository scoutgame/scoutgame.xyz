'use client';

import { Box, Card, CardContent, Stack, Typography, Button } from '@mui/material';
import { MATCHUP_REGISTRATION_FEE } from '@packages/matchup/config';
import Image from 'next/image';
import type { ReactNode } from 'react';

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
        Kick things off by registering! Pay the {MATCHUP_REGISTRATION_FEE} Scout Point entry fee before 11:59 PM Monday
        UTC to join this week’s action.
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
        <Typography variant='body2' sx={{ mb: 2 }}>
          Here’s what’s up for grabs every week:
        </Typography>
        <Typography fontSize='.8rem'>
          🏆 1st Place: 50% of the prize pool + 60{' '}
          <Image width={10} height={10} src='/images/crypto/op.png' alt='' style={{ display: 'inline' }} />
        </Typography>
        <Typography fontSize='.8rem'>
          🥈 2nd Place: 30% of the prize pool + 25 <Image width={10} height={10} src='/images/crypto/op.png' alt='' />
        </Typography>
        <Typography fontSize='.8rem' sx={{ mb: 1 }}>
          🥉 3rd Place: 20% of the prize pool + 15
          <Image width={10} height={10} src='/images/crypto/op.png' alt='' />
        </Typography>
        <Box mr={3}>
          <Typography fontSize='.8rem' align='center' sx={{ mb: 2 }}>
            🎟️ 4th Place & 5th Place:
            <br />
            FREE ticket for a future match
          </Typography>
          <Typography fontSize='.8rem' align='center'>
            Think you’ve got what it takes to build a winning team? Let’s find out!
          </Typography>
        </Box>
      </>
    )
  }
];

const closedRegistrationFirstSlide: SlideContent = {
  subtitle: '1. Register',
  iconSrc: '/images/matchup/howtoplay_closed.svg',
  text: (
    <Typography variant='body2'>
      Registration for this week’s Match Up is closed. Come back Monday and pay the {MATCHUP_REGISTRATION_FEE} Scout
      Point entry fee before 11:59 PM Monday UTC to join next week’s action..
    </Typography>
  )
};

export function HowToPlayCard({ registrationOpen }: { registrationOpen: boolean }) {
  const slidesToShow = registrationOpen ? slides : [closedRegistrationFirstSlide, ...slides.slice(1)];
  return (
    <Card sx={{ mb: 2, overflow: 'visible', borderColor: 'secondary.main' }}>
      <CardContent>
        <Typography variant='h5' color='secondary' fontWeight={600} sx={{ mb: 2, ml: 2, pl: '42px' }}>
          Play Weekly Match Up!
        </Typography>

        <EmblaCarousel
          options={{
            align: 'center',
            slidesToScroll: 1
          }}
          slides={slidesToShow.map((slide) => (
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
