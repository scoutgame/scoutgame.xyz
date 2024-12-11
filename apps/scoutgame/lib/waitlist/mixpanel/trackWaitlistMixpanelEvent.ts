import { log } from '@charmverse/core/log';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';

import type { WaitlistEvent, WaitlistEventMap } from './trackEventActionSchema';

export function trackWaitlistMixpanelEvent<T extends WaitlistEvent = WaitlistEvent>(
  event: T,
  params: WaitlistEventMap[T]
) {
  try {
    trackUserAction(event as any, { ...params, userId: (params as { userId?: string }).userId || '' });
  } catch (error) {
    log.error('Failed to track waitlist mixpanel event', { event, params, error });
  }
}
