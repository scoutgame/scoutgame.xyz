'use client';

import { useDatadogLogger } from '@packages/scoutgame-ui/hooks/useDatadogLogger';
import { useInitFarcasterData } from '@packages/scoutgame-ui/hooks/useInitFarcasterData';
import { useInitTelegramData } from '@packages/scoutgame-ui/hooks/useInitTelegramData';
import { usePageView } from '@packages/scoutgame-ui/hooks/usePageView';
import { getPlatform } from '@packages/utils/platform';

import WelcomeModal from './WelcomeModal';

// instantiate global hooks for the client-side only
export function ClientGlobals({ userId }: { userId?: string }) {
  const platform = getPlatform();
  const service =
    platform === 'telegram'
      ? 'scoutgametelegram-browser'
      : platform === 'farcaster'
        ? 'scoutgamefarcaster-browser'
        : 'scoutgame-browser';

  useDatadogLogger({ service, userId });
  usePageView();
  useInitTelegramData();
  useInitFarcasterData();

  return <WelcomeModal userId={userId} />;
}
