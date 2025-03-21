import { isOnchainPlatform } from '@packages/utils/platform';

import { scoutProtocolBuilderNftContractAddress } from '../../protocol/constants';

// something to differentiate between different deployments of a contract
export const builderNftArtworkContractName =
  // Use the address from the builder nft contract for the artwork path
  isOnchainPlatform() ? scoutProtocolBuilderNftContractAddress : process.env.SCOUTGAME_CONTRACT_NAME || 'dev';
