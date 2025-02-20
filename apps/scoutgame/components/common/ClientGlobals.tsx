'use client';

import sdk from '@farcaster/frame-sdk';
import { getPlatform } from '@packages/mixpanel/platform';
import { useDatadogLogger } from '@packages/scoutgame-ui/hooks/useDatadogLogger';
import { useInitTelegramData } from '@packages/scoutgame-ui/hooks/useInitTelegramData';
import { usePageView } from '@packages/scoutgame-ui/hooks/usePageView';
import { useEffect } from 'react';

import WelcomeModal from './WelcomeModal';

// instantiate global hooks for the client-side only
export function ClientGlobals({ userId }: { userId?: string }) {
  const platform = getPlatform();
  const service = platform === 'telegram' ? 'scoutgametelegram-browser' : 'scoutgame-browser';

  useDatadogLogger({ service, userId });
  usePageView();
  useInitTelegramData();

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      // If context is not present we are not inside a farcaster client
      if (context) {
        await sdk.actions.ready({});
        const nonce = Math.random().toString(36).substring(2, 10);
        await sdk.actions.signIn({
          nonce,
          expirationTime: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        });
      }
    };

    if (sdk) {
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, []);

  return <WelcomeModal userId={userId} />;
}
