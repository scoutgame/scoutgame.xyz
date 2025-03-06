import type { Block, Transaction } from 'viem';
import { createPublicClient, http, getAddress } from 'viem';

import { getChainById } from './chains';

export async function getContractDeployerAddress({
  contractAddress,
  chainId
}: {
  contractAddress: string;
  chainId: number;
}): Promise<{ transaction: Transaction; block: Block }> {
  const chain = getChainById(chainId)?.viem;
  if (!chain) {
    throw new Error(`Chain ID ${chainId} not supported`);
  }

  const client = createPublicClient({
    chain,
    transport: http()
  });

  const formattedAddress = getAddress(contractAddress);

  const bytecode = await client.getCode({
    address: formattedAddress
  });

  if (!bytecode) {
    throw new Error('Contract not found on the selected chain or is not a contract address');
  }

  let left = BigInt(0);
  let right = await client.getBlockNumber();

  while (left <= right) {
    const mid = left + (right - left) / BigInt(2);

    const code = await client.getCode({
      address: formattedAddress,
      blockNumber: mid
    });

    if (!code) {
      left = mid + BigInt(1);
    } else {
      const prevCode = await client.getCode({
        address: formattedAddress,
        blockNumber: mid - BigInt(1)
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
              return {
                transaction: tx,
                block
              };
            }
          }
        }
      }
      right = mid - BigInt(1);
    }
  }

  throw new Error('Could not determine deployer address');
}
