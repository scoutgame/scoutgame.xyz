import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { builderNftChain, builderSmartContractMinterKey } from '@packages/scoutgame/builderNfts/constants';
import { sleep } from '@packages/utils/sleep';
import type { WalletClient } from 'viem';
import { createWalletClient, http, publicActions, nonceManager } from 'viem';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import { optimism } from 'viem/chains';

import { getChainById } from './chains';
import { getAlchemyBaseUrl } from './provider/alchemy/client';

const MAX_TX_RETRIES = 10;

export function getWalletClient({
  chainId,
  privateKey,
  mnemonic
}: {
  chainId: number;
  privateKey?: string;
  mnemonic?: string;
}) {
  const chain = getChainById(chainId);

  if (!chain?.viem) {
    throw new InvalidInputError(`Chain id ${chainId} does not yet contain a viem connector`);
  }

  if (!privateKey && !mnemonic) {
    throw new InvalidInputError('Private key or mnemonic is required to create a wallet client');
  }

  const account = mnemonic
    ? mnemonicToAccount(mnemonic, { nonceManager })
    : privateKeyToAccount((privateKey!.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`, {
        nonceManager
      });

  let rpcUrl = chain.rpcUrls[0];

  if (chainId === optimism.id) {
    const apiKey = process.env.ANKR_API_ID;
    if (!apiKey) {
      log.warn('No ANKR_API_ID found, using default rpc url');
    } else {
      rpcUrl = `https://rpc.ankr.com/optimism/${apiKey}`;
    }
  } else {
    try {
      const alchemyUrl = getAlchemyBaseUrl(chainId);

      rpcUrl = alchemyUrl;
    } catch (e) {
      // If the alchemy url is not valid, we use the rpc url
    }
  }

  const client = createWalletClient({
    chain: chain.viem,
    account,
    transport: http(rpcUrl, {
      timeout: 5000
    })
  }).extend(publicActions);

  const originalSendTransaction = client.sendTransaction;

  async function overridenSendTransaction(
    ...args: Parameters<WalletClient['sendTransaction']>
  ): Promise<Awaited<ReturnType<WalletClient['sendTransaction']>>> {
    for (let i = 0; i < MAX_TX_RETRIES; i++) {
      try {
        const result = await originalSendTransaction(...args);

        await client.waitForTransactionReceipt({ hash: result });

        return result;
      } catch (e) {
        const replacementTransactionUnderpriced = /replacement/;
        const nonceErrorExpression = /nonce|already used|pending|already known/;

        const errorAsString = JSON.stringify(e);
        const isNonceError = errorAsString.match(nonceErrorExpression);
        const isReplacementTransactionUnderpriced = errorAsString.match(replacementTransactionUnderpriced);

        // console.log('isNonceError', isNonceError);
        // console.log('isReplacementTransactionUnderpriced', isReplacementTransactionUnderpriced);

        if (isNonceError || isReplacementTransactionUnderpriced) {
          if (i >= MAX_TX_RETRIES) {
            log.error(`Max retries reached for sending transaction, ${i}`, { e, args });
            throw e;
          }

          log.info(`Retrying failed transaction attempt nb. ${i + 1}`, { e, args });

          args[0].nonce = await client.getTransactionCount({
            address: client.account.address
          });

          const randomTimeout = Math.floor(Math.random() * 3000) + 2000; // Random timeout between 2-5 seconds
          await sleep(randomTimeout);
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

const client = getWalletClient({
  chainId: optimism.id,
  privateKey: builderSmartContractMinterKey
});

// console.log('Address', client.account.address);

// async function test() {
//   await Promise.all(
//     Array.from({ length: 5 }, async (_, i) => {
//       const multiplier = BigInt(1000000000000);

//       const value = multiplier * BigInt(i + 1);

//       // console.log('Value', value);

//       const first = '0x518AF6fA5eEC4140e4283f7BDDaB004D45177946';
//       const second = '0xA0e2928705304a6e554166251C1E8f4340b81547';

//       const tx = await client.sendTransaction({
//         to: second,
//         value: multiplier * BigInt(i + 1)
//       });
//     })
//   );
// }

// test().then(console.log);

// client.getBlockNumber().then(console.log);
