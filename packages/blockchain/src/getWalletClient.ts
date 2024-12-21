import { InvalidInputError } from '@charmverse/core/errors';
import { createWalletClient, http, publicActions } from 'viem';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';

import { getChainById } from './chains';
import { getAlchemyBaseUrl } from './provider/alchemy/client';

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
    ? mnemonicToAccount(mnemonic)
    : privateKeyToAccount((privateKey!.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`);

  let rpcUrl = chain.rpcUrls[0];

  try {
    const alchemyUrl = getAlchemyBaseUrl(chainId);

    rpcUrl = alchemyUrl;
  } catch (e) {
    // If the alchemy url is not valid, we use the rpc url
  }

  return createWalletClient({
    chain: chain.viem,
    account,
    transport: http(rpcUrl, {
      retryCount: 1,
      timeout: 5000
    })
  }).extend(publicActions);
}
