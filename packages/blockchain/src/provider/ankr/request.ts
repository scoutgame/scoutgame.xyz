import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import { POST } from '@packages/utils/http';
import { RateLimit } from 'async-sema';

let _nextId = 133782;

// Find all supported chains:  https://www.ankr.com/docs/advanced-api/overview/#chains-supported
export const supportedChains = {
  // 56: 'bsc',
  // 1101: 'polygon_zkevm',
  // 250: 'fantom',
  // 43114: 'avalanche',
  // 5000: 'mantle',
  // 137: 'polygon',
  167000: 'taiko',
  167009: 'taiko_hekla'
} as const;

export type SupportedChainId = keyof typeof supportedChains;

// ≈1800 requests/minute for Public tier - https://www.ankr.com/docs/rpc-service/service-plans/#rate-limits
// Note: if ankr is used heavily on multiple instances/apps, we might want to reduce the rate limit
const rateLimiter = RateLimit(1500, { timeUnit: 60 * 1000, uniformDistribution: true });

export function getAnkrBaseUrl(chainId: SupportedChainId) {
  const ankrApiId = env('ANKR_API_ID') || process.env.REACT_APP_ANKR_API_ID;
  const chainPath = supportedChains[chainId];
  if (!chainPath) throw new Error(`Chain id "${chainId}" not supported by Ankr`);
  if (!ankrApiId) throw new Error(`No ankr api id found for chain id "${chainId}"`);
  return `https://rpc.ankr.com/${chainPath}/${ankrApiId}`; /// ${process.env.ANKR_API_ID}`;
}

export type ResponseError = {
  error: { code: number; message: string };
};

export type AnkrResponse<T> = {
  result: T;
  id: number;
  jsonrpc: string;
};

export async function ankrRequest<T>({
  chainId,
  method,
  params
}: {
  chainId: SupportedChainId;
  method: string;
  params: any;
}): Promise<T> {
  const baseUrl = getAnkrBaseUrl(chainId);
  await rateLimiter();
  _nextId += 1;
  return POST<AnkrResponse<T> | ResponseError>(baseUrl, {
    id: _nextId,
    method,
    params
  }).then((r) => {
    // console.log('res', r);
    if ((r as ResponseError).error) {
      log.error('Ankr error', { error: (r as ResponseError).error });
      throw new Error((r as ResponseError).error.message);
    }
    // console.log('ankrRequest response', JSON.stringify(r, null, 2));
    return (r as AnkrResponse<T>).result;
  });
}
