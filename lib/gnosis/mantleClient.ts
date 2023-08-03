import type { SafeTransactionData } from '@safe-global/safe-core-sdk-types';
import { utils } from 'ethers';

import * as http from 'adapters/http';

type MantleMultisigSafe = {
  address: {
    value: string;
  };
  chainId: string;
  nonce: number;
  threshold: number;
  owners: {
    value: string;
  }[];
  implementation: {
    value: string;
  };
  modules: null;
  fallbackHandler: {
    value: string;
  };
  guard: null;
  version: string;
  implementationVersionState: string;
  collectiblesTag: string;
  txQueuedTag: string;
  txHistoryTag: string;
  messagesTag: string;
};

export function getSafesByOwner({
  serviceUrl,
  chainId,
  address
}: {
  serviceUrl: string;
  chainId: number;
  address: string;
}) {
  return http.GET<{ safes: string[] }>(`${serviceUrl}/v1/chains/${chainId}/owners/${address}/safes`, undefined, {
    credentials: 'omit'
  });
}

export function getSafeData({
  serviceUrl,
  chainId,
  address
}: {
  serviceUrl: string;
  chainId: number;
  address: string;
}) {
  return http.GET<MantleMultisigSafe>(`${serviceUrl}/v1/chains/${chainId}/safes/${address}`, undefined, {
    credentials: 'omit'
  });
}

export function proposeTransaction({
  safeTransactionData,
  txHash,
  signature,
  safeAddress,
  senderAddress,
  chainId
}: {
  txHash: string;
  signature: string;
  senderAddress: string;
  safeAddress: string;
  safeTransactionData: SafeTransactionData;
  chainId: number;
}) {
  return http.POST(
    `https://gateway.multisig.mantle.xyz/v1/chains/${chainId}/transactions/${utils.getAddress(safeAddress)}/propose`,
    {
      ...safeTransactionData,
      safeTxHash: txHash,
      sender: senderAddress,
      signature,
      origin
    },
    {
      credentials: 'omit'
    }
  );
}
