import { log } from '@charmverse/core/log';
import { getPlatform } from '@packages/utils/platform';

import type { MixpanelEventMap, MixpanelEventName, MixpanelTrackBase } from './interfaces';
import { mixpanel } from './mixpanel';
import type { UTMParams } from './utils';
import { eventNameToHumanFormat, paramsToHumanFormat } from './utils';

export function trackUserAction<T extends MixpanelEventName>(
  eventName: T,
  params: MixpanelEventMap[T],
  utmParams?: UTMParams // pass these in separately as the names should not be modified
) {
  const { userId, platform = getPlatform(), ...restParams } = params as MixpanelEventMap[T] & { platform?: string };
  // map userId prop to distinct_id required by mixpanel to recognize the user
  const mixpanelTrackParams: MixpanelTrackBase = {
    distinct_id: userId,
    platform,
    ip: '0', // Disable IP tracking. This is overwritten by page_view events
    ...paramsToHumanFormat(restParams),
    // when tracking utm_params in Mixpanel event, it should also update the user profile with initial_<utm_param> properties
    // source: https://docs.mixpanel.com/docs/tracking-methods/sdks/javascript#track-utm-tags
    ...utmParams
  };

  const humanReadableEventName = eventNameToHumanFormat(eventName as string);

  try {
    mixpanel?.track(humanReadableEventName, mixpanelTrackParams);
    if (utmParams) {
      // prepend initial_ to the utm params so they are easily identifiable in Mixpanel
      const initialUtmParams = Object.entries(utmParams).reduce((acc, [key, value]) => {
        acc[`initial_${key}`] = value;
        return acc;
      }, {} as UTMParams);
      mixpanel?.people.set_once(userId, initialUtmParams);
    }
  } catch (error) {
    log.warn(`Failed to track mixpanel event ${eventName as string}`, {
      error,
      humanReadableEventName,
      params: mixpanelTrackParams
    });
  }
}
