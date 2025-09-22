import { log } from '@charmverse/core/log';
import { Octokit } from '@octokit/core';
import { paginateGraphQL } from '@octokit/plugin-paginate-graphql';
import { paginateRest } from '@octokit/plugin-paginate-rest';
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods';
import { throttling } from '@octokit/plugin-throttling';

const OctokitWithThrottling = Octokit.plugin(throttling, paginateRest, paginateGraphQL, restEndpointMethods);

// GitHub access tokens for round-robin rotation
const GITHUB_TOKENS =
  process.env.GITHUB_ACCESS_TOKENS?.split(',')
    .map((token) => token.trim())
    .filter(Boolean) || [];

let currentTokenIndex = 0;

// Function to get the next token in rotation
function getNextToken(): string {
  if (GITHUB_TOKENS.length === 0) {
    throw new Error('No GitHub access tokens configured');
  }

  const token = GITHUB_TOKENS[currentTokenIndex];
  currentTokenIndex = (currentTokenIndex + 1) % GITHUB_TOKENS.length;

  log.info(`[Octokit] Using token ${currentTokenIndex}/${GITHUB_TOKENS.length}`);
  return token;
}

// Custom auth function that rotates tokens on every request
function createRotatingAuth() {
  return () => {
    const token = getNextToken();
    return { type: 'token', token };
  };
}

// Create the octokit instance with rotating auth
export const octokit = new OctokitWithThrottling({
  auth: createRotatingAuth(),
  throttle: {
    // @ts-ignore
    onRateLimit: (retryAfter, options, _octokit, retryCount) => {
      log.warn(
        `[Octokit] Rate limit hit despite rotation. Rotating to next token and retrying after ${retryAfter} seconds! Retry count: ${retryCount}`
      );

      // Rotate to the next token when rate limited
      getNextToken();

      return retryCount < 3; // Retry up to 3 times
    },
    // @ts-ignore
    onSecondaryRateLimit: (retryAfter, options, _octokit) => {
      log.warn(
        `[Octokit] SecondaryRateLimit detected for request ${options.method} ${options.url}. Rotating to next token and retrying after ${retryAfter} seconds!`
      );

      // Rotate to the next token on secondary rate limit as well
      getNextToken();

      return true;
    }
  }
});
