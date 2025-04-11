'use client';

import { Stack, Typography } from '@mui/material';
import { getSeasonConfig } from '@packages/dates/utils';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const seasonOne = getSeasonConfig('2025-W18');

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
      direction='row'
      spacing={2}
      justifyContent='center'
      alignItems='center'
      sx={{
        width: '100%',
        my: 4
      }}
    >
      <TimeUnit value={timeLeft.days} label='Days' />
      <TimeUnit value={timeLeft.hours} label='Hours' />
      <TimeUnit value={timeLeft.minutes} label='Minutes' />
      <TimeUnit value={timeLeft.seconds} label='Seconds' />
    </Stack>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <Stack alignItems='center' gap={1}>
      <Stack
        sx={{
          bgcolor: 'background.dark',
          borderRadius: 1,
          p: 2,
          minWidth: 100,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Typography variant='h2' sx={{ fontWeight: 700 }}>
          {value.toString().padStart(2, '0')}
        </Typography>
      </Stack>
      <Typography variant='body1' color='text.secondary'>
        {label}
      </Typography>
    </Stack>
  );
}
