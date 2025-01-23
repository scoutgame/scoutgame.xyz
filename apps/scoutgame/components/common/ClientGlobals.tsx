'use client';

import { getPlatform } from '@packages/mixpanel/platform';
import { useDatadogLogger } from '@packages/scoutgame-ui/hooks/useDatadogLogger';
import { useInitTelegramData } from '@packages/scoutgame-ui/hooks/useInitTelegramData';
import { usePageView } from '@packages/scoutgame-ui/hooks/usePageView';

import WelcomeModal from './WelcomeModal';

// instantiate global hooks for the client-side only
export function ClientGlobals({ userId }: { userId?: string }) {
  const platform = getPlatform();
  const service = platform === 'telegram' ? 'scoutgametelegram-browser' : 'scoutgame-browser';

  useDatadogLogger({ service, userId });
  usePageView();
  useInitTelegramData();

  return <WelcomeModal userId={userId} />;
}
