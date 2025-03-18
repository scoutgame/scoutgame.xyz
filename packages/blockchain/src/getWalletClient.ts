import env from '@beam-australia/react-env';
import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { sleep } from '@packages/utils/sleep';
import type { Account, Client, Chain, PublicActions, RpcSchema, Transport, WalletActions, WalletClient } from 'viem';
import { createWalletClient, http, publicActions, nonceManager } from 'viem';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import { optimism } from 'viem/chains';

import { getChainById } from './chains';
import { getAlchemyBaseUrl } from './provider/alchemy/client';

// origin for this type: https://github.com/wevm/viem/discussions/1463
// source: https://www.typescriptlang.org/play/#code/JYWwDg9gTgLgBDAnmApnA3nAggYxxAVwDsYAaOAYQBtgUTyKALAQ2CPIAUCAjGnXGMAhEAzuQBKYHAGUcjFCGbkAKlGajIscgHVmVKihgChouAF84AMygQQcAEQA3WiHsBuAFAeUAD03wkVDhpAlQoXX1DaloSAB4POAQ1DWh4Xxg6ABMROFV1EX84AF5c5ILU0gS4OVYiOHSsnKZauAAfOGJMlEs2FEziyhY2No6iLp6iPsrE5jxCEnqfDLGc3HxieHbO7t7+krX5zdHx3cqAPgHouhh4xJgy-2nqofYq2fX6KskZOQUlKq4vGA-BwgmEIli93yj2etXI70OFwAZHAIgYjKCTBCamx4XMNmcPGdPB58KJ4DgaNcBugLMwciEwmiolSSF5KTEYAA6ERZPKiWZgogeAD0IsSEoAegB+dms7kAc0M-JEgpMovFErgMqAA
type SuperWalletClient<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined
> = Client<
  transport,
  chain,
  account,
  RpcSchema,
  PublicActions<transport, chain, account> & WalletActions<chain, account>
>;

const MAX_TX_RETRIES = 10;

export function getWalletClient({
  chainId,
  privateKey,
  mnemonic
}: {
  chainId: number;
  privateKey?: string;
  mnemonic?: string;
}): SuperWalletClient {
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
    const ankrApiId = env('ANKR_API_ID') || process.env.REACT_APP_ANKR_API_ID;
    if (!ankrApiId) {
      log.warn('No ANKR_API_ID found, using default rpc url');
    } else {
      rpcUrl = `https://rpc.ankr.com/optimism/${ankrApiId}`;
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

  client.sendTransaction = overridenSendTransaction as WalletClient['sendTransaction'];

  return client;
}
