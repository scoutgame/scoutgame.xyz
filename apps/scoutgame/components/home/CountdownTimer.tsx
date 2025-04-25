'use client';

import { Stack, Typography } from '@mui/material';
import { seasons } from '@packages/dates/config';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const seasonOne = seasons.find((season) => season.id === 'season-1')!;

const SEASON_ONE_START = DateTime.fromISO(seasonOne.start).startOf('week');

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = DateTime.now();
      const diff = SEASON_ONE_START.diff(now, ['days', 'hours', 'minutes', 'seconds']);

      setTimeLeft({
        days: Math.floor(diff.days),
        hours: Math.floor(diff.hours % 24),
        minutes: Math.floor(diff.minutes % 60),
        seconds: Math.floor(diff.seconds % 60)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Stack
      alignItems='center'
      gap={2}
      sx={{
        background: 'linear-gradient(135deg, #192553 0%, #3b0f63 100%)',
        p: { xs: 1.5, md: 2.5 },
        pt: { xs: 1.5, md: 4 },
        borderRadius: {
          xs: 1,
          md: 2
        }
      }}
    >
      <Stack direction='row' spacing={{ xs: 1, md: 2 }} justifyContent='center' alignItems='center'>
        <TimeUnit value={timeLeft.days} label='Days' />
        <TimeUnit value={timeLeft.hours} label='Hours' />
        <TimeUnit value={timeLeft.minutes} label='Minutes' />
        <TimeUnit value={timeLeft.seconds} label='Seconds' />
      </Stack>
      <Typography fontWeight={600}>April 28, 2025</Typography>
    </Stack>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  const isMdScreen = useMdScreen();

  return (
    <Stack alignItems='center' gap={1}>
      <Stack
        sx={{
          bgcolor: '#111827',
          borderRadius: 1,
          px: { xs: 1, md: 1.5 },
          py: { xs: 0.5, md: 1 },
          minWidth: { xs: 60, md: 125 },
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Typography
          variant={isMdScreen ? 'h3' : 'h4'}
          sx={{
            fontWeight: 700
          }}
        >
          {value.toString().padStart(2, '0')}
        </Typography>
      </Stack>
      <Typography variant='caption' color='#999'>
        {label}
      </Typography>
    </Stack>
  );
}
