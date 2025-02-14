import { GET } from '@packages/utils/http';
import { RateLimit } from 'async-sema';

export const supportedChains = {
  167000: 'taiko',
  167009: 'taiko_hekla'
} as const;

export type SupportedChainId = keyof typeof supportedChains;

// 5 req/sec
const rateLimiter = RateLimit(5, { uniformDistribution: true });

const apikey = process.env.TAIKO_API_KEY;
const baseUrl = 'https://api.taikoscan.io/api';

export type Params = {
  module: 'account' | 'contract';
  action: 'txlist' | 'getcontractcreation' | 'getsourcecode';
  address?: string;
  startblock?: bigint;
  endblock?: bigint;
  page?: number;
  offset?: number;
  sort?: 'asc' | 'desc';
};

type Response<T> = { status: '0' | '1'; message: string; result: T | string };

export async function taikoRequest<T, P extends Params = Params>(params: P) {
  await rateLimiter();
  const response = await GET<Response<T>>(baseUrl, {
    apikey,
    ...params
  });
  if (response.status === '0') {
    throw new Error(response.result as string);
  }
  return response.result as T;
}
