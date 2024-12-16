'use client';

import { useDatadogLogger } from '@packages/scoutgame-ui/hooks/useDatadogLogger';
import { usePageView } from '@packages/scoutgame-ui/hooks/usePageView';

import WelcomeModal from './WelcomeModal';

// instantiate global hooks for the client-side only
export function ClientGlobals({ userId }: { userId?: string }) {
  usePageView();
  useDatadogLogger({ service: 'scoutgame-browser', userId });

  return <WelcomeModal userId={userId} />;
}
