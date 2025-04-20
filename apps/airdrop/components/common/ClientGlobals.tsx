'use client';

import { useDatadogLogger } from '@packages/scoutgame-ui/hooks/useDatadogLogger';
import { usePageView } from '@packages/scoutgame-ui/hooks/usePageView';

import { useInitFarcasterData } from '@/hooks/useInitFarcasterData';

// instantiate global hooks for the client-side only
export function ClientGlobals({ userId }: { userId?: string }) {
  useDatadogLogger({ service: 'scoutgame-airdrop-browser', userId });
  usePageView();
  useInitFarcasterData();

  return null;
}
