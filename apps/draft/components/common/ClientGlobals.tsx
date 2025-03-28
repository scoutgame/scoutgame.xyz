'use client';

import { useDatadogLogger } from '@packages/scoutgame-ui/hooks/useDatadogLogger';
import { usePageView } from '@packages/scoutgame-ui/hooks/usePageView';

// instantiate global hooks for the client-side only
export function ClientGlobals({ userId }: { userId?: string }) {
  useDatadogLogger({ service: 'scoutgame-draft-browser', userId });
  usePageView();

  return null;
}
