import type { Transaction } from 'viem';
import { createPublicClient, http, getAddress } from 'viem';

import { getChainById } from './chains';

export async function getContractDeployerAddress({
  contractAddress,
  chainId
}: {
  contractAddress: string;
  chainId: number;
}): Promise<Transaction> {
  const chain = getChainById(chainId)?.viem;
  if (!chain) {
    throw new Error(`Chain ID ${chainId} not supported`);
  }

  const client = createPublicClient({
    chain,
    transport: http()
  });

  const formattedAddress = getAddress(contractAddress);

  const bytecode = await client.getBytecode({
    address: formattedAddress
  });

  if (!bytecode) {
    throw new Error('Contract not found or is not a contract address');
  }

  let left = 0n;
  let right = await client.getBlockNumber();

  while (left <= right) {
    const mid = left + (right - left) / 2n;

    const code = await client.getBytecode({
      address: formattedAddress,
      blockNumber: mid
    });

    if (!code) {
      left = mid + 1n;
    } else {
      const prevCode = await client.getBytecode({
        address: formattedAddress,
        blockNumber: mid - 1n
      });

      if (!prevCode) {
        const block = await client.getBlock({
          blockNumber: mid,
          includeTransactions: true
        });

        for (const tx of block.transactions) {
          // eslint-disable-next-line no-continue
          if (typeof tx === 'string') continue;

          if (tx.to === null && tx.input.length > 2) {
            const receipt = await client.getTransactionReceipt({ hash: tx.hash });
            if (receipt.contractAddress?.toLowerCase() === formattedAddress.toLowerCase()) {
              return tx;
            }
          }
        }
      }
      right = mid - 1n;
    }
  }

  throw new Error('Could not determine deployer address');
}
