'use client';

import { Typography } from '@mui/material';
import { useEffect, useState } from 'react';

export function WeeklyMatchupCalloutTimer({ upcomingTime }: { upcomingTime: number }) {
  const [timeLeftStr, setTimeStr] = useState(getTimeLeftStr(upcomingTime));
  useEffect(() => {
    const timeout = setInterval(() => {
      setTimeStr(getTimeLeftStr(upcomingTime));
    }, 1000);

    return () => clearInterval(timeout);
  }, [setTimeStr, upcomingTime]);

  return (
    <Typography variant='body2' component='em' color='secondary'>
      Begins in {timeLeftStr}
    </Typography>
  );
}

function getTimeLeftStr(upcomingTime: number) {
  const now = new Date();
  const timeLeft = upcomingTime - now.getTime();

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return `${days > 0 ? `${days}d ` : ''}${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`;
}
