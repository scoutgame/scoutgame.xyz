import { log } from '@charmverse/core/log';
import sdk from '@farcaster/frame-sdk';
import { useEffect } from 'react';

export function useInitFarcasterData() {
  useEffect(() => {
    const load = async () => {
      try {
        const context = await sdk.context;
        // If context is not present we are not inside a farcaster client
        if (!context) {
          return;
        }

        // Immediately signal that the frame is ready and hide the splash screen
        await sdk.actions.ready({});
      } catch (error) {
        log.error('Error initializing farcaster', { error });
      }
    };

    if (sdk) {
      load();
    }

    return () => {
      sdk.removeAllListeners();
    };
  }, []);
}
