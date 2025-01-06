import { POST } from '@charmverse/core/http';

import { getApiKey } from './mixpanel';

export async function deleteMixpanelProfiles(users: { id: string }[]) {
  const apiKey = getApiKey();

  return POST(
    'https://api.mixpanel.com/engage#profile-delete',
    users.map((user) => ({
      $token: apiKey,
      $distinct_id: user.id,
      $delete: 'null'
    }))
  );
}
