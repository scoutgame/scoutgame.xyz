
import { RPC } from 'connectors';
import { GET } from 'adapters/http';
import { isTruthy } from 'lib/utilities/types';
import { ethers } from 'ethers';
import EthersAdapter from '@gnosis.pm/safe-ethers-lib';
import SafeServiceClient, { SafeInfoResponse } from '@gnosis.pm/safe-service-client';

const gnosisRPCs = Object.values(RPC);

function getGnosisRPCUrl (chainId: number) {
  const network = Object.values(RPC).find(rpc => rpc.chainId === chainId);
  return network?.gnosisUrl;
}

interface GetGnosisServiceProps {
  signer: ethers.Signer;
  chainId?: number;
  gnosisUrl?: string;
}

function getGnosisService ({ signer, chainId, gnosisUrl }: GetGnosisServiceProps): SafeServiceClient | null {

  const txServiceUrl = gnosisUrl || (chainId && getGnosisRPCUrl(chainId));
  if (!txServiceUrl) {
    return null;
  }

  const ethAdapter = new EthersAdapter({
    ethers,
    signer
  });

  const safeService = new SafeServiceClient({
    txServiceUrl,
    ethAdapter
  });

  return safeService;
}

interface GetSafesForAddressProps {
  signer: ethers.Signer;
  address: string;
  chainId: number;
}

async function getSafesForAddress ({ signer, chainId, address }: GetSafesForAddressProps): Promise<({ chainId: number } & SafeInfoResponse)[]> {
  const gnosisUrl = getGnosisRPCUrl(chainId);
  console.log(chainId, gnosisUrl);
  if (!gnosisUrl) {
    return [];
  }
  const service = getGnosisService({ signer, gnosisUrl });
  if (service) {
    return service.getSafesByOwner(address)
      .then(r => Promise.all(r.safes.map(safeAddr => {
        return service.getSafeInfo(safeAddr)
          .then(info => ({ ...info, chainId }));
      })));
  }
  return [];
}

export async function getSafesForAddresses (signer: ethers.Signer, addresses: string[]) {

  const safes = await Promise.all(Object.values(RPC).map(network => {
    return Promise.all(addresses.map(address => getSafesForAddress({ signer, chainId: network.chainId, address })));
  })).then(list => list.flat().flat());

  return safes;
}
