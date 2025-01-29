import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { sleep } from '@packages/utils/sleep';
import type { WalletClient } from 'viem';
import { createWalletClient, http, publicActions } from 'viem';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';

import { getChainById } from './chains';
import { getAlchemyBaseUrl } from './provider/alchemy/client';

const MAX_TX_RETRIES = 10;

export function getWalletClient({
  chainId,
  privateKey,
  mnemonic,
  httpRetries = 1
}: {
  chainId: number;
  privateKey?: string;
  mnemonic?: string;
  httpRetries?: number;
}) {
  const chain = getChainById(chainId);

  if (!chain?.viem) {
    throw new InvalidInputError(`Chain id ${chainId} does not yet contain a viem connector`);
  }

  if (!privateKey && !mnemonic) {
    throw new InvalidInputError('Private key or mnemonic is required to create a wallet client');
  }

  const account = mnemonic
    ? mnemonicToAccount(mnemonic)
    : privateKeyToAccount((privateKey!.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`);

  let rpcUrl = chain.rpcUrls[0];

  try {
    const alchemyUrl = getAlchemyBaseUrl(chainId);

    rpcUrl = alchemyUrl;
  } catch (e) {
    // If the alchemy url is not valid, we use the rpc url
  }

  const client = createWalletClient({
    chain: chain.viem,
    account,
    transport: http(rpcUrl, {
      retryCount: httpRetries,
      timeout: 5000
    })
  }).extend(publicActions);

  const originalSendTransaction = client.sendTransaction;

  async function overridenSendTransaction(
    ...args: Parameters<WalletClient['sendTransaction']>
    // Needed to make the function return type compatible with the original sendTransaction function
  ): Promise<Awaited<ReturnType<WalletClient['sendTransaction']>>> {
    let nextNonce =
      args[0].nonce ??
      (await client.getTransactionCount({
        address: account.address
      })) + 1;

    const slicedArgs = [
      {
        ...args[0],
        nonce: nextNonce
      },
      ...args.slice(1)
    ] as Parameters<WalletClient['sendTransaction']>;

    for (let i = 0; i < MAX_TX_RETRIES; i++) {
      try {
        const result = await originalSendTransaction(...slicedArgs);

        return result;
      } catch (e) {
        const replacementTransactionUnderpriced = /replacement transaction underpriced/;
        const nonceErrorExpression = /nonce too low/;

        const errorAsString = JSON.stringify(e);

        if (errorAsString.match(nonceErrorExpression) || errorAsString.match(replacementTransactionUnderpriced)) {
          const retryAttempts = (args[0] as { retryAttempts?: number })?.retryAttempts ?? 0;

          (args[0] as { retryAttempts?: number }).retryAttempts = retryAttempts + 1;

          if (retryAttempts >= MAX_TX_RETRIES) {
            log.error(`Max retries reached for sending transaction, ${retryAttempts}`, { e, args });
            throw e;
          }

          log.info(`Retrying failed transaction attempt nb. ${retryAttempts}`, { e, args });

          const randomTimeout = Math.floor(Math.random() * 3000) + 2000; // Random timeout between 2-10 seconds
          await sleep(randomTimeout);

          if (errorAsString.match(nonceErrorExpression)) {
            const nonceMatch = errorAsString.match(/nonce too low: next nonce (\d+)/);
            if (nonceMatch) {
              nextNonce = parseInt(nonceMatch[1], 10);
            }
          } else {
            nextNonce =
              (await client.getTransactionCount({
                address: account.address,
                blockTag: 'pending'
              })) + 1;
          }
        } else {
          throw e;
        }
      }
    }

    throw new Error('Max retries reached for sending transaction');
  }

  client.sendTransaction = overridenSendTransaction as any;

  return client;
}

// const client = getWalletClient({
//   chainId: builderNftChain.id,
//   privateKey: builderSmartContractMinterKey
// });

// client
//   .getTransactionCount({
//     address: client.account.address,
//     blockTag: 'latest'
//   })
//   .then(console.log);
