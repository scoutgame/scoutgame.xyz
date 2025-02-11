import { fetchQueryWithPagination, init } from '@airstack/node';
import { POST } from '@charmverse/core/http';
import { log } from '@charmverse/core/log';
import { RateLimit } from 'async-sema';

const apiKey = process.env.AIRSTACK_API_KEY;

if (apiKey) {
  // set the api key
  init(process.env.AIRSTACK_API_KEY as string, 'prod');
}

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

export async function airstackRequestWithPagination<T>(query: string): Promise<T[]> {
  let count = 0;
  const results: T[] = [];
  let response: any;
  while (true) {
    await rateLimiter();
    if (!response) {
      response = await fetchQueryWithPagination(query);
    }
    const { data, error, hasNextPage, getNextPage } = response;
    if (!error) {
      count += 1;
      results.push(data);
      if (!hasNextPage) {
        break;
      } else {
        response = await getNextPage();
      }
    } else {
      log.error('Error requesting from airstack: ', { query, error });
      throw new Error(`Error requesting from airstack: ${error}`);
    }
  }
  return results;
}
