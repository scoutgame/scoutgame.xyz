import { GET, PUT, POST, DELETE } from '@charmverse/core/http';

// Beehiiv manages our newsletters
// Visit the dashboard: https://app.beehiiv.com/settings/integrations/api
// API docs: https://developers.beehiiv.com/docs/v2/y34f5xzx5hwg4-beehiiv-api

const apiBaseUrl = process.env.BEEHIIV_API_URL as string | undefined;
const publicationId = process.env.BEEHIIV_PUBLICATION_ID as string | undefined;

const apiToken = process.env.BEEHIIV_API_KEY as string | undefined;
export const isEnabled = !!apiToken && !!apiBaseUrl && !!publicationId;

export type BeehiivSubscription = {
  email: string;
};

const headers = {
  Authorization: `Bearer ${apiToken}`
};

// ref: https://developers.beehiiv.com/api-reference/subscriptions/create
export async function createSubscription(params: BeehiivSubscription & { reactivate_existing?: boolean }) {
  _validateConfig();
  return POST(`${apiBaseUrl}/publications/${publicationId}/subscriptions`, params, {
    headers
  });
}

// ref: https://developers.beehiiv.com/api-reference/subscriptions/index
export async function findSubscriptions(query: Partial<BeehiivSubscription>) {
  _validateConfig();
  return GET<{ data: { id: string }[] }>(`${apiBaseUrl}/publications/${publicationId}/subscriptions`, query, {
    headers
  });
}

// ref: https://developers.beehiiv.com/api-reference/subscriptions/delete
export async function deleteSubscription({ id }: { id: string }) {
  _validateConfig();
  return DELETE(`${apiBaseUrl}/publications/${publicationId}/subscriptions/${id}`, {
    headers
  });
}

// ref: https://developers.beehiiv.com/api-reference/subscriptions/put
export async function unsubscribeSubscription({ email }: BeehiivSubscription) {
  _validateConfig();
  const existing = await findSubscriptions({ email });
  if (existing.data.length > 0) {
    return PUT(
      `${apiBaseUrl}/publications/${publicationId}/subscriptions/${existing.data[0].id}`,
      { unsubscribe: true },
      {
        headers
      }
    );
  }
}

function _validateConfig() {
  if (!apiToken) {
    throw new Error('Beehiiv API token is not set');
  }
  if (!apiBaseUrl) {
    throw new Error('Beehiiv API base URL is not set');
  }
  if (!publicationId) {
    throw new Error('Beehiiv Publication ID is not set');
  }
}
