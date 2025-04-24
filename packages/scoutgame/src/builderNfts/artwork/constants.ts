import { getCurrentSeasonStart } from '@packages/dates/utils';

import { getBuilderNftContractAddress } from '../constants';

// something to differentiate between different deployments of a contract
export const builderNftArtworkContractName = getBuilderNftContractAddress(getCurrentSeasonStart()) || 'dev';
