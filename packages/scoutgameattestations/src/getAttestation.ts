import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { getChainById } from '@packages/blockchain/chains';
import { Network, JsonRpcProvider } from 'ethers';

import { scoutGameAttestationChainId } from './constants';
import type { EASSchemaChain } from './easSchemas/constants';
import { easConfig } from './easSchemas/constants';

export function getAttestation({ attestationUid, chainId }: { attestationUid: string; chainId: EASSchemaChain }) {
  const rpcUrl = getChainById(chainId)?.rpcUrls[0] as string;
  // ethers v6 version of StaticJSONRPCProvider https://github.com/ethers-io/ethers.js/discussions/3994
  const provider = new JsonRpcProvider(rpcUrl, undefined, {
    staticNetwork: Network.from(scoutGameAttestationChainId)
  });

  const eas = new EAS(easConfig[scoutGameAttestationChainId].easContractAddress);

  eas.connect(provider);

  return eas.getAttestation(attestationUid);
}
