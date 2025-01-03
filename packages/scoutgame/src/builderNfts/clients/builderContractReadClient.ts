import { getPublicClient } from '@packages/blockchain/getPublicClient';

import { getBuilderNftContractAddress, builderNftChain } from '../constants';

import { BuilderNFTSeasonOneImplementation01Client } from './builderNFTSeasonOneClient';

export const builderContractReadonlyApiClient = new BuilderNFTSeasonOneImplementation01Client({
  chain: builderNftChain,
  contractAddress: getBuilderNftContractAddress(),
  publicClient: getPublicClient(builderNftChain.id)
});
