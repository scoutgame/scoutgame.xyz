import type { MixpanelEventName } from '@packages/mixpanel/interfaces';
import * as yup from 'yup';

export const eventSchema = yup.object().shape({
  event: yup.string<MixpanelEventName>().required(),
  isAnonymous: yup.boolean(),
  currentPageTitle: yup.string(),
  currentDomain: yup.string(),
  currentUrlPath: yup.string(),
  currentUrlSearch: yup.string(),
  $referrer: yup.string().url(),
  $referring_domain: yup.string(),
  $screen_height: yup.string(),
  $screen_width: yup.string(),
  platform: yup.string()
});
export type Payload = yup.InferType<typeof eventSchema>;
