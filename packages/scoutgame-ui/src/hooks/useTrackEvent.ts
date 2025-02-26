'use client';

import sdk from '@farcaster/frame-sdk';
import type { MixpanelEventName } from '@packages/mixpanel/interfaces';
import { trackEventAction } from '@packages/scoutgame/mixpanel/trackEventAction';
import { getPlatform } from '@packages/utils/platform';
import { isValidURL } from '@packages/utils/url';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useEffect, useState } from 'react';

import { useIsFarcasterFrame } from './useIsFarcasterFrame';

export function useTrackEvent() {
  const { execute } = useAction(trackEventAction);
  const platform = getPlatform();
  const isFarcasterFrame = useIsFarcasterFrame();

  return useCallback(
    function trackEvent(event: MixpanelEventName, properties?: Record<string, string | number | boolean>) {
      const initialReferrer = document.referrer;
      const isReferrerValid = isValidURL(initialReferrer);
      const referrer = isReferrerValid ? initialReferrer : undefined;
      const referrerDomain = isReferrerValid ? new URL(initialReferrer).hostname : undefined;

      execute({
        event,
        currentPageTitle: document.title,
        currentDomain: window.location.hostname,
        currentUrlPath: window.location.pathname,
        currentUrlSearch: window.location.search,
        // default event props in mixpanel
        $screen_width: String(window.screen.width),
        $screen_height: String(window.screen.height),
        $referrer: referrer,
        $referring_domain: referrerDomain,
        platform: isFarcasterFrame ? 'farcaster' : platform,
        ...properties
      });
    },
    [execute, platform, isFarcasterFrame]
  );
}
