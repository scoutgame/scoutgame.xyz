import { getCurrentSeasonStart } from '@packages/dates/utils';

import { getPreSeasonTwoBuilderNftContractMinterClient } from './preseason02/getPreSeasonTwoBuilderNftContractMinterClient';
import { getPreSeasonTwoBuilderNftContractReadonlyClient } from './preseason02/getPreSeasonTwoBuilderNftContractReadonlyClient';
import { getSeasonOneBuilderNftContractMinterClient } from './season01/getSeasonOneBuilderNftContractMinterClient';
import { getSeasonOneBuilderNftContractReadonlyClient } from './season01/getSeasonOneBuilderNftContractReadonlyClient';

export function getBuilderNftContractReadonlyClient() {
  const season = getCurrentSeasonStart();

  switch (season) {
    case '2025-W17':
      return getSeasonOneBuilderNftContractReadonlyClient();
    case '2025-W02':
      return getPreSeasonTwoBuilderNftContractReadonlyClient();
    default:
      throw new Error(`Unsupported season: ${season}`);
  }
}

export function getBuilderNftContractMinterClient() {
  const season = getCurrentSeasonStart();

  switch (season) {
    case '2025-W17':
      return getSeasonOneBuilderNftContractMinterClient();
    case '2025-W02':
      return getPreSeasonTwoBuilderNftContractMinterClient();
    default:
      throw new Error(`Unsupported season: ${season}`);
  }
}
