import { getPublicClient } from '@packages/blockchain/getPublicClient';

import { builderNftChain, getBuilderNftContractAddress } from '../constants';

import { BuilderNFTSeasonOneUpgradeableABIClient } from './BuilderNFTSeasonOneUpgradeableABIClient';

export const builderProxyContractReadonlyApiClient = new BuilderNFTSeasonOneUpgradeableABIClient({
  chain: builderNftChain,
  contractAddress: getBuilderNftContractAddress(),
  publicClient: getPublicClient(builderNftChain.id)
});
