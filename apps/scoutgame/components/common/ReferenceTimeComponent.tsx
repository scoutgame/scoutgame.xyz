'use client';

import { useEffect, useState } from 'react';

// timestamp is in milliseconds, like JS Date.now()
export function ReferenceTimeComponent({ prefix, timestamp }: { prefix?: string; timestamp: number }) {
  const [timeLeftStr, setTimeStr] = useState(getTimeLeftStr(timestamp));
  useEffect(() => {
    const timeout = setInterval(() => {
      setTimeStr(getTimeLeftStr(timestamp));
    }, 1000);

    return () => clearInterval(timeout);
  }, [setTimeStr, timestamp]);

  return (
    <span>
      {prefix} {timeLeftStr}
    </span>
  );
}

// return the absolute amount of time from the unixTimestamp
function getTimeLeftStr(timestamp: number) {
  const now = new Date();
  const timeLeft = Math.abs(timestamp - now.getTime());

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return `${days > 0 ? `${days}d ` : ''}${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`;
}
