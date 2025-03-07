import { log } from '@charmverse/core/log';
import { DuneClient, QueryParameter } from '@duneanalytics/client-sdk';
import { RateLimit } from 'async-sema';

// rate limit for read queries is 40/minute
// ref: https://docs.dune.com/api-reference/overview/rate-limits
const rateLimiter = RateLimit(30, { timeUnit: 60 * 1000 });

// Initialize Dune client
const duneClient = new DuneClient(process.env.DUNE_API_KEY || '');

type WalletDailyStats = {
  day: Date;
  transactions: number;
  accounts: number;
  gasFees: string; // in wei
};

type DuneQueryResult<T> = {
  result?: {
    rows: T[];
    metadata: {
      pending_time_millis: number;
      execution_time_millis: number;
    };
  };
  error?: {
    message: string;
  };
};

const evmChainIdToDuneChain = {
  10: 'optimism',
  1: 'ethereum',
  137: 'polygon',
  42161: 'arbitrum',
  100: 'gnosis',
  56: 'bsc',
  8453: 'base'
} as const;

type DailyStatFromDune = {
  day: string;
  num_transactions: number;
  unique_counterparties: number;
  gas_fees: number;
};

export async function getEvmAddressStats({
  address,
  chainId,
  startDate,
  endDate
}: {
  address: string;
  chainId: number;
  startDate: Date;
  endDate: Date;
}): Promise<WalletDailyStats[]> {
  // https://dune.com/queries/4812202
  const queryId = 4812202;
  const chain = evmChainIdToDuneChain[chainId as keyof typeof evmChainIdToDuneChain];
  if (!chain) {
    throw new Error(`Unidentified chain for Dune query: ${chainId}`);
  }

  await rateLimiter();
  const response = (await duneClient.runQuery({
    queryId,
    query_parameters: [
      QueryParameter.text('address', address),
      QueryParameter.text('chain', chain),
      QueryParameter.text('start_date', startDate.toISOString().split('T')[0]),
      QueryParameter.text('end_date', endDate.toISOString().split('T')[0])
    ]
  })) as DuneQueryResult<DailyStatFromDune>;

  if (!response.result) {
    log.warn(`No result from Dune query: ${queryId}`, { error: response.error, response });
    throw new Error('No result from Dune query');
  }

  return response.result.rows.map((row) => ({
    day: new Date(row.day),
    transactions: row.num_transactions,
    accounts: row.unique_counterparties,
    gasFees: row.gas_fees.toString()
  }));
}

export async function getSolanaWalletStats({
  address,
  startDate,
  endDate
}: {
  address: string;
  startDate: Date;
  endDate: Date;
}): Promise<WalletDailyStats[]> {
  // https://dune.com/queries/4812208
  // const queryId = 4812208; // includes gas but times out (429)
  const queryId = 4813103;

  await rateLimiter();
  const response = (await duneClient.runQuery({
    queryId,
    query_parameters: [
      QueryParameter.text('address', address),
      QueryParameter.text('start_date', startDate.toISOString().split('T')[0]),
      QueryParameter.text('end_date', endDate.toISOString().split('T')[0])
    ]
  })) as DuneQueryResult<DailyStatFromDune>;
  if (!response.result) {
    log.warn(`No result from Dune query: ${queryId}`, { error: response.error, response });
    throw new Error('No result from Dune query');
  }

  return response.result.rows.map((row) => ({
    day: new Date(row.day),
    transactions: row.num_transactions,
    accounts: row.unique_counterparties,
    gasFees: '0' // row.gas_fees.toString()
  }));
}
