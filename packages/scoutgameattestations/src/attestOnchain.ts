import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { getChainById } from '@packages/blockchain/chains';
import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import { Network, Wallet, JsonRpcProvider } from 'ethers';
import type { Address } from 'viem';

import type { EASSchemaChain } from './easSchemas/constants';
import { easConfig } from './easSchemas/constants';
import { attestationLogger } from './logger';

export type ScoutGameAttestationInput = {
  schemaId: string;
  recipient?: Address;
  refUID?: `0x${string}`;
  data: `0x${string}`;
};

async function setupEAS({ chainId }: { chainId: EASSchemaChain }) {
  const attesterWalletKey = process.env.SCOUTPROTOCOL_EAS_ATTESTER_PRIVKEY;
  const easContractAddress = easConfig[chainId].easContractAddress;

  const rpcUrl = getChainById(chainId)?.rpcUrls[0] as string;
  const ankrApiKey = process.env.REACT_APP_ANKR_API_ID;

  if (!ankrApiKey) {
    throw new Error('ANKR_API_ID is not set');
  }

  // ethers v6 version of StaticJSONRPCProvider https://github.com/ethers-io/ethers.js/discussions/3994
  const provider = new JsonRpcProvider(`${rpcUrl}/${ankrApiKey}`, undefined, {
    staticNetwork: Network.from(chainId)
  });

  const wallet = new Wallet(attesterWalletKey as string, provider);

  const eas = new EAS(easContractAddress);

  eas.connect(wallet);

  const currentGasPrice = (await provider.getFeeData()).gasPrice;

  return {
    eas,
    currentGasPrice
  };
}

export async function attestOnchain({
  data,
  schemaId,
  refUID,
  recipient,
  chainId
}: ScoutGameAttestationInput & { chainId: EASSchemaChain }): Promise<`0x${string}`> {
  const { eas, currentGasPrice } = await setupEAS({ chainId });

  const attestationUid = await eas
    .attest(
      {
        schema: schemaId,
        data: {
          recipient: recipient ?? NULL_EVM_ADDRESS,
          data,
          refUID,
          revocable: true
        }
      },
      { gasPrice: currentGasPrice }
    )
    .then((tx) => tx.wait());

  attestationLogger.info(`Issued attestation for schema ${schemaId} on chain ${chainId} with uid: ${attestationUid}`, {
    chainId,
    schemaId
  });

  return attestationUid as `0x${string}`;
}

const maxPerBatch = 30;

export async function multiAttestOnchain(params: {
  schemaId: string;
  chainId: EASSchemaChain;
  records: Omit<ScoutGameAttestationInput, 'schemaId'>[];
  onAttestSuccess?: (input: { attestationUid: string; data: `0x${string}`; index: number }) => Promise<void>;
  batchStartIndex?: number;
}): Promise<`0x${string}`[]> {
  if (params.records.length === 0) {
    return [];
  }

  if (params.records.length > maxPerBatch) {
    const allUids: `0x${string}`[] = [];
    for (let i = 0; i < params.records.length; i += maxPerBatch) {
      const uids = await multiAttestOnchain({
        schemaId: params.schemaId,
        records: params.records.slice(i, i + maxPerBatch),
        onAttestSuccess: params.onAttestSuccess,
        batchStartIndex: i,
        chainId: params.chainId
      });
      allUids.push(...uids);
    }

    return allUids;
  }

  const { schemaId, records, onAttestSuccess, batchStartIndex = 0, chainId } = params;

  const { eas, currentGasPrice } = await setupEAS({ chainId });

  const attestationUids = await eas
    .multiAttest(
      [
        {
          schema: schemaId,
          data: records.map((r) => ({
            recipient: r.recipient ?? NULL_EVM_ADDRESS,
            data: r.data,
            refUID: r.refUID,
            revocable: true
          }))
        }
      ],
      { gasPrice: currentGasPrice }
    )
    .then((tx) => tx.wait());

  if (onAttestSuccess) {
    for (let i = 0; i < attestationUids.length; i++) {
      await onAttestSuccess({ attestationUid: attestationUids[i], data: records[i].data, index: batchStartIndex + i });
    }
  }

  attestationLogger.info(
    `Issued ${attestationUids.length} attestations for schema ${schemaId} on chain ${chainId} with uids: ${attestationUids.join(', ')}`,
    {
      chainId,
      schemaId
    }
  );

  return attestationUids as `0x${string}`[];
}
