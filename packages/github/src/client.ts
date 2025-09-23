import { log } from '@charmverse/core/log';
import { Octokit } from '@octokit/core';
import { paginateGraphQL } from '@octokit/plugin-paginate-graphql';
import { paginateRest } from '@octokit/plugin-paginate-rest';
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods';
import { throttling } from '@octokit/plugin-throttling';

const MyOctokit = Octokit.plugin(throttling, paginateRest, paginateGraphQL, restEndpointMethods);

export const GITHUB_ACCESS_TOKENS = (process.env.GITHUB_ACCESS_TOKENS ?? '')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean);

const BATCH_AVAILABLE_GITHUB_ACCESS_TOKENS = GITHUB_ACCESS_TOKENS.slice(1);

let tokenIndex = 0;

export function getOctokit(_token?: string) {
  const token = _token || BATCH_AVAILABLE_GITHUB_ACCESS_TOKENS[tokenIndex];
  if (!_token) {
    tokenIndex = (tokenIndex + 1) % BATCH_AVAILABLE_GITHUB_ACCESS_TOKENS.length;
  }

  return new MyOctokit({
    auth: token,
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
}
