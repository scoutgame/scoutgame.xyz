'use client';

import { Stack, Typography } from '@mui/material';
import { getServerDate, timeUntilFuture } from '@packages/utils/dates';
import { useEffect, useState } from 'react';

export function NextClaimCountdown() {
  const currentDate = getServerDate();
  const nextDay = currentDate.plus({ days: 1 }).startOf('day');
  const nextDayMillis = nextDay.toMillis();
  const [timeStr, setTimeStr] = useState(timeUntilFuture(nextDayMillis));

  useEffect(() => {
    const timeout = setInterval(() => {
      setTimeStr(timeUntilFuture(nextDayMillis));
    }, 1000);

    return () => clearInterval(timeout);
  }, [setTimeStr, nextDayMillis]);

  if (!timeStr) {
    return null;
  }

  return (
    <Stack flexDirection='column' alignItems='center' gap={1}>
      <Typography color='secondary' fontWeight={600}>
        NEXT REWARD
      </Typography>
      <Stack flexDirection='row' alignItems='center' gap={0.5}>
        <Typography variant='h5' fontWeight={600}>
          {timeStr.hours}
        </Typography>
        <Typography fontWeight={600} mr={0.5}>
          h
        </Typography>
        <Typography variant='h5' fontWeight={600}>
          {timeStr.minutes}
        </Typography>
        <Typography fontWeight={600}>m</Typography>
      </Stack>
    </Stack>
  );
}
