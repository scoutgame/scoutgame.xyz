import type { MixpanelEventName } from '@packages/mixpanel/interfaces';
import { trackEventAction } from '@packages/scoutgame/mixpanel/trackEventAction';
import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

export function useTrackEvent() {
  const { execute } = useAction(trackEventAction);

  return useCallback(
    function trackEvent(event: MixpanelEventName, properties?: Record<string, string | number | boolean>) {
      execute({
        event,
        currentPageTitle: document.title,
        currentDomain: window.location.hostname,
        currentUrlPath: window.location.pathname,
        currentUrlSearch: window.location.search,
        // default event props in mixpanel
        $screen_width: String(window.screen.width),
        $screen_height: String(window.screen.height),
        ...properties
      });
    },
    [execute]
  );
}
