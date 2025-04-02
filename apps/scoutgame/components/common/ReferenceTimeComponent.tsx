'use client';

import { useEffect, useState } from 'react';

export function ReferenceTimeComponent({ prefix, unixTimestamp }: { prefix?: string; unixTimestamp: number }) {
  const [timeLeftStr, setTimeStr] = useState(getTimeLeftStr(unixTimestamp));
  useEffect(() => {
    const timeout = setInterval(() => {
      setTimeStr(getTimeLeftStr(unixTimestamp));
    }, 1000);

    return () => clearInterval(timeout);
  }, [setTimeStr, unixTimestamp]);

  return (
    <span>
      {prefix} {timeLeftStr}
    </span>
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
