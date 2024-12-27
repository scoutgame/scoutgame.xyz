import { POST } from '@charmverse/core/http';
import { log } from '@charmverse/core/log';
import { RateLimit } from 'async-sema';
// at most, 50 req per second
// Moxy's rate limit is 3000/min and burst of 300/second.
// @source https://docs.airstack.xyz/airstack-docs-and-faqs/api-capabilities#rate-limits
const rateLimiter = RateLimit(50);

export async function airstackRequest<T>(query: string): Promise<T> {
  await rateLimiter();
  return POST<T>(
    'https://api.airstack.xyz/gql',
    { query },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: process.env.AIRSTACK_API_KEY as string
      }
    }
  );
}
