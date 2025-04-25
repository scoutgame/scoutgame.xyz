'use client';

import { Box, Skeleton, Typography } from '@mui/material';
import {
  getCurrentSeasonWeekNumber,
  getWeekendDate,
  getWeekStartEnd,
  isDraftSeason,
  isEndOfDraftWeek
} from '@packages/dates/utils';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';

import { useIsMounted } from '../../../hooks/useIsMounted';

export function HeaderMessage() {
  const [timeLeftStr, setTimeStr] = useState(getTimeLeftStr());
  const isMounted = useIsMounted();
  const draftSeason = isDraftSeason();
  const isDraftOver = isEndOfDraftWeek();

  useEffect(() => {
    if (draftSeason && isDraftOver) {
      return;
    }

    const timeout = setInterval(() => {
      setTimeStr(getTimeLeftStr());
    }, 1000);

    return () => clearInterval(timeout);
  }, [draftSeason, isDraftOver]);

  let message = '';

  if (draftSeason) {
    if (isWeekend) {
      message = 'Draft has ended';
    } else {
      message = `Draft ends in ${timeLeftStr}`;
    }
  } else {
    message = `Week ${getCurrentSeasonWeekNumber()} ends in ${timeLeftStr}`;
  }

  return (
    <Box width='100%' minHeight='40px' bgcolor='primary.dark' p={1} display='flex' justifyContent='center'>
      {isMounted ? (
        <Typography variant='body1' fontWeight='500' textAlign='center'>
          {message}
        </Typography>
      ) : (
        <Skeleton width='50%' />
      )}
    </Box>
  );
}

function getTimeLeftStr() {
  const draftSeason = isDraftSeason();
  const endOfWeek = draftSeason
    ? getWeekendDate().toJSDate().getTime()
    : getWeekStartEnd(new Date()).end.toJSDate().getTime();
  const timeLeft = endOfWeek - new Date().getTime();

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return `${days}d ${hours}h ${minutes}m`;
}
