import { GET } from '@packages/utils/http';
import { RateLimit } from 'async-sema';

// Find all supported chains:  https://www.ankr.com/docs/advanced-api/overview/#chains-supported
const supportedChains = {
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
const rateLimiter = RateLimit(1500, { timeUnit: 60 * 1000, uniformDistribution: true });

const apikey = process.env.TAIKO_API_KEY;
const baseUrl = 'https://api.taikoscan.io/api';

type Params = {
  module: 'account' | 'contract';
  action: 'txlist' | 'getcontractcreation';
  address?: string;
  startblock?: bigint;
  endblock?: bigint;
  page?: number;
  offset?: number;
  sort?: 'asc' | 'desc';
};

type Response<T> = { status: '0' | '1'; message: string; result: T | string };

export async function taikoRequest<T, P extends Params>(params: P) {
  const response = await GET<Response<T>>(baseUrl, {
    apikey,
    ...params
  });
  if (response.status === '0') {
    throw new Error(response.result as string);
  }
  return response.result as T;
}
