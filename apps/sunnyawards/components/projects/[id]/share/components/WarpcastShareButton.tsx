'use client';

import { useEffect, useState } from 'react';

import { WarpcastButton } from './WarpcastButton';

export function WarpcastShareButton({ projectIdOrPath }: { projectIdOrPath: string }) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    setUrl(`${window.location.origin}/p/${projectIdOrPath}`);
  }, []);

  return (
    <div data-test='share-project-to-warpcast'>
      <WarpcastButton
        href={`https://warpcast.com/~/compose?text=${encodeURIComponent(
          'I just registered for the Sunny Awards to be eligible for 540K OP!'
        )}&embeds[]=${url}`}
        text='Share'
      />
    </div>
  );
}
