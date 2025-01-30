import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { getChainById } from '@packages/blockchain/chains';
import { Network, JsonRpcProvider } from 'ethers';

import { scoutGameAttestationChainId, scoutGameEasAttestationContractAddress } from './constants';

export function getAttestion({ attestationUid }: { attestationUid: string }) {
  const rpcUrl = getChainById(scoutGameAttestationChainId)?.rpcUrls[0] as string;
  // ethers v6 version of StaticJSONRPCProvider https://github.com/ethers-io/ethers.js/discussions/3994
  const provider = new JsonRpcProvider(rpcUrl, undefined, {
    staticNetwork: Network.from(scoutGameAttestationChainId)
  });

  const eas = new EAS(scoutGameEasAttestationContractAddress);

  eas.connect(provider);

  return eas.getAttestation(attestationUid);
}
