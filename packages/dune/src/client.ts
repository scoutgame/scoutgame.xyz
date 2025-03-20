import { DuneClient, QueryParameter } from '@duneanalytics/client-sdk';
import { RateLimit } from 'async-sema';

// rate limit for read queries is 40/minute
// ref: https://docs.dune.com/api-reference/overview/rate-limits
export const rateLimiter = RateLimit(30, { timeUnit: 60 * 1000 });

export const isEnabled = process.env.DUNE_API_KEY !== undefined;

// Initialize Dune client
export const duneClient = new DuneClient(process.env.DUNE_API_KEY || '');
