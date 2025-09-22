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

let tokenIndex = 0;

export function getOctokit() {
  const token = TOKENS[tokenIndex];
  tokenIndex = (tokenIndex + 1) % TOKENS.length;

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
