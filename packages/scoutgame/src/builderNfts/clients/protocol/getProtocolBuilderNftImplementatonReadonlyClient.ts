import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { Chain, Address } from 'viem';

import { scoutProtocolBuilderNftContractAddress, scoutProtocolChain } from '../../../protocol/constants';

import { ScoutProtocolBuilderNFTImplementationClient } from './wrappers/ScoutProtocolBuilderNFTImplementation';

export function getProtocolBuilderNftImplementationReadonlyClient({
  chain = scoutProtocolChain,
  contractAddress = scoutProtocolBuilderNftContractAddress
}: {
  chain?: Chain;
  contractAddress?: Address;
} = {}) {
  return new ScoutProtocolBuilderNFTImplementationClient({
    chain,
    contractAddress,
    publicClient: getPublicClient(chain.id)
  });
}
