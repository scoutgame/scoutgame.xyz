import { getPublicClient } from '@packages/blockchain/getPublicClient';

import { builderNftChain, getBuilderNftStarterPackContractAddress } from '../constants';

import { BuilderNFTSeasonOneStarterPackImplementationClient } from './BuilderNFTSeasonOneStarterPackImplementationClient';

export const builderContractStarterPackReadonlyApiClient = new BuilderNFTSeasonOneStarterPackImplementationClient({
  chain: builderNftChain,
  contractAddress: getBuilderNftStarterPackContractAddress(),
  publicClient: getPublicClient(builderNftChain.id)
});
