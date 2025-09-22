import { log } from '@charmverse/core/log';
import { Octokit } from '@octokit/core';
import { paginateGraphQL } from '@octokit/plugin-paginate-graphql';
import { paginateRest } from '@octokit/plugin-paginate-rest';
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods';
import { throttling } from '@octokit/plugin-throttling';

const MyOctokit = Octokit.plugin(throttling, paginateRest, paginateGraphQL, restEndpointMethods);

const TOKENS = (process.env.GITHUB_ACCESS_TOKENS ?? '')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean);

let idx = 0;
const nextToken = () => {
  const token = TOKENS[idx];
  idx = (idx + 1) % TOKENS.length;
  return token;
};

export const octokit = new MyOctokit({
  auth: TOKENS[0], // Set initial auth so throttling plugin works properly
  throttle: {
    onRateLimit: (retryAfter, options, _octokit, retryCount) => {
      log.warn(`[Octokit] Rate limit hit. Retrying after ${retryAfter} seconds! Retry count: ${retryCount}`);
      // Retry a few times according to headers/X-RateLimit-Reset
      return retryCount < 3;
    },
    onSecondaryRateLimit: (retryAfter, options, _octokit) => {
      log.warn(`[Octokit] Secondary rate limit hit. Retrying after ${retryAfter} seconds!`);
      // Back off when secondary rate limit triggers
      return true;
    }
  }
});

// Inject a token and rotate on auth/rate-limit failures
octokit.hook.wrap('request', async (request, options) => {
  const token = nextToken();
  try {
    return await request({
      ...options,
      headers: {
        ...options.headers,
        authorization: `token ${token}`
      }
    });
  } catch (err: any) {
    const status = err?.status;
    const remaining = Number(err?.response?.headers?.['x-ratelimit-remaining']);
    const retryAfterHdr = Number(err?.response?.headers?.['retry-after']);
    const resetTime = err?.response?.headers?.['x-ratelimit-reset'];
    const primaryExhausted = Number.isFinite(remaining) && remaining === 0;
    const secondaryBackoff = Number.isFinite(retryAfterHdr);

    log.warn(
      `[Octokit] Request failed - Status: ${status}, Remaining: ${remaining}, Retry-After: ${retryAfterHdr}, Reset: ${resetTime}, Token: ...${token.slice(-4)}`
    );

    // Rotate to the next token only on auth errors or clear rate-limit signals
    if (status === 401 || status === 403 || primaryExhausted || secondaryBackoff) {
      log.warn(`[Octokit] Will try next token on retry...`);
    }
    throw err;
  }
});
