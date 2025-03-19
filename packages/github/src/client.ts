import { log } from '@charmverse/core/log';
import { Octokit } from '@octokit/core';
import { paginateGraphQL } from '@octokit/plugin-paginate-graphql';
import { paginateRest } from '@octokit/plugin-paginate-rest';
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods';
import { throttling } from '@octokit/plugin-throttling';

const OctokitWithThrottling = Octokit.plugin(throttling, paginateRest, paginateGraphQL, restEndpointMethods);

export const octokit = new OctokitWithThrottling({
  auth: process.env.GITHUB_ACCESS_TOKEN,
  throttle: {
    // @ts-ignore
    onRateLimit: (retryAfter, options, _octokit, retryCount) => {
      log.info(`[Octokit] Retrying after ${retryAfter} seconds! Retry count: ${retryCount}`);
      return true;
      // if (retryCount < 2) {
      //   // only retries twice
      //   return true;
      // }
    },
    // @ts-ignore
    onSecondaryRateLimit: (retryAfter, options, _octokit) => {
      // does not retry, only logs a warning
      log.warn(
        `[Octokit] SecondaryRateLimit detected for request ${options.method} ${options.url}. Retrying after ${retryAfter} seconds!`
      );
      // try again
      return true;
    }
  }
});
