import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { builderNftChain, builderSmartContractMinterKey } from '@packages/scoutgame/builderNfts/constants';
import { sleep } from '@packages/utils/sleep';
import type { WalletClient } from 'viem';
import { createWalletClient, http, publicActions, nonceManager } from 'viem';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import { optimism, baseSepolia } from 'viem/chains';

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
