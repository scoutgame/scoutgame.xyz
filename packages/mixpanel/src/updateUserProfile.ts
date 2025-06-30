import { POST } from '@charmverse/core/http';
import type { BuilderStatus } from '@charmverse/core/prisma';

import type { MixpanelEventName, MixpanelEventMap } from './interfaces';
import { getApiKey } from './mixpanel';

export type MixPanelUserProfile = {
  $name: string;
  $email: string | null;
  path: string;
  onboarded: boolean;
  deleted: boolean;
  'Agreed To TOS': boolean;
  'Builder Status': BuilderStatus | null;
  referrals: number;
  'Verified Email': boolean;
  'Purchased NFT': boolean;
  'Completed Social Quest': boolean;
};

export function updateMixpanelUserProfile(userId: string, profile: Partial<MixPanelUserProfile>) {
  const apiKey = getApiKey();

  return POST('https://api.mixpanel.com/engage#profile-set', {
    $token: apiKey,
    $distinct_id: userId,
    $ip: '0',
    $set: profile
  });
}

export function batchUpdateMixpanelUserProfiles(users: { userId: string; profile: Partial<MixPanelUserProfile> }[]) {
  const apiKey = getApiKey();

  return POST(
    'https://api.mixpanel.com/engage#profile-batch-update',
    users.map((user) => ({
      $token: apiKey,
      $distinct_id: user.userId,
      $ip: '0', // don't set the user location. Set it only if the user chooses a location for himself
      $set: user.profile
    }))
  );
}

// We accept up to 2000 events and 2MB uncompressed per request
export async function batchImportMixpanelEvent<T extends MixpanelEventName>(
  data: { event: T; properties: MixpanelEventMap[T] & { time: number; $insert_id: string } }[]
) {
  const apiKey = getApiKey();
  const projectId = '1234'; // Take this from the mixpanel dashboard

  return POST(
    `https://api.mixpanel.com/import?strict=1&project_id=${projectId}`,
    data.map(({ event, properties }) => {
      const { userId, ...restProps } = properties;

      return {
        event,
        properties: {
          ip: '0', // don't set the user location.
          distinct_id: userId,
          ...restProps
        }
      };
    }),
    {
      headers: {
        authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`
      }
    }
  );
}
