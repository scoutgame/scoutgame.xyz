'use client';

import { useDatadogLogger } from '@packages/scoutgame-ui/hooks/useDatadogLogger';

import { useInitTelegramData } from 'hooks/useInitTelegramData';

// instantiate global hooks for the client-side only
export function ClientGlobals({ userId }: { userId?: string }) {
  useDatadogLogger({ service: 'scoutgametelegram-browser', userId });
  useInitTelegramData();

  return null;
}
