import sdk from '@farcaster/frame-sdk';
import { useEffect, useState } from 'react';

export function useIsFarcasterFrame() {
  const [isFarcasterFrame, setIsFarcasterFrame] = useState(false);

  useEffect(() => {
    async function checkFarcasterFrameContext() {
      const context = await sdk.context;
      if (context) {
        setIsFarcasterFrame(true);
      }
    }
    checkFarcasterFrameContext();
  }, []);

  return isFarcasterFrame;
}
