import type { MixpanelEventMap, MixpanelEventName } from '@packages/mixpanel/interfaces';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import type { UTMParams } from '@packages/mixpanel/utils';
import { getIPFromRequest } from '@packages/nextjs/utils/getIPFromRequest';
import { isValidURL } from '@packages/utils/url';
import { headers } from 'next/headers';
import { userAgent } from 'next/server';

/**
 * Used for tracking events with user agent details in mixpanel
 *
 * @returns void
 */
export function trackUserEnhancedAction<T extends MixpanelEventName>(
  eventName: T,
  params: MixpanelEventMap[T],
  utmParams?: UTMParams
) {
  const headersList = headers();
  const referrer = headersList.get('Referer') || undefined;
  const isReferrerValid = isValidURL(referrer);
  const referrerDomain = isReferrerValid ? new URL(referrer).hostname : undefined;

  const reqUserAgent = userAgent({ headers: headersList });

  const ip = getIPFromRequest();

  const deviceProps = {
    $browser: reqUserAgent?.browser.name,
    $device: reqUserAgent?.device?.model,
    $os: reqUserAgent?.os.name,
    $referrer: referrer,
    $referring_domain: referrerDomain,
    ip,
    // Custom event props
    deviceType: reqUserAgent.device?.type === 'mobile' ? 'mobile' : 'desktop',
    isBot: reqUserAgent.isBot
  } as const;

  return trackUserAction(eventName, { ...deviceProps, ...params }, utmParams);
}
