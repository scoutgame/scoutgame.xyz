import { optimismUsdcContractAddress } from '@packages/scoutgame/builderNfts/constants';
import type { Address } from 'viem';
import { optimism } from 'viem/chains';

import { getPublicClient } from '../getPublicClient';

const USDC_TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export type UsdcTransaction = {
  from: Address;
  to: Address;
  value: bigint;
  blockNumber: bigint;
  transactionHash: string;
  timestamp: Date;
};

export async function getUsdcTransactions({
  toAddress,
  fromBlock,
  toBlock
}: {
  toAddress: Address;
  fromBlock: bigint;
  toBlock: bigint;
}): Promise<UsdcTransaction[]> {
  const publicClient = getPublicClient(optimism.id);

  const logs = await publicClient.getContractEvents({
    address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    eventName: 'Transfer',
    abi: [
      {
        type: 'event',
        name: 'Transfer',
        inputs: [
          {
            indexed: true,
            name: 'from',
            type: 'address'
          },
          {
            indexed: true,
            name: 'to',
            type: 'address'
          },
          {
            indexed: false,
            name: 'value',
            type: 'uint256'
          }
        ]
      }
    ],
    args: {
      to: toAddress
    },
    fromBlock,
    toBlock
  });

  const transactions = await Promise.all(
    logs.map(async (log) => {
      const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
      return {
        from: log.args.from as Address,
        to: log.args.to as Address,
        value: log.args.value as bigint,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        timestamp: new Date(Number(block.timestamp) * 1000)
      };
    })
  );

  return transactions;
}
