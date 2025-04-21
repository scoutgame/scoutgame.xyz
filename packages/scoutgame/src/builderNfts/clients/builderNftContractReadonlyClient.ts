import { log } from '@charmverse/core/log';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import { getPreSeasonTwoBuilderNftContractMinterClient } from './preseason02/getPreSeasonTwoBuilderNftContractMinterClient';
import { getPreSeasonTwoBuilderNftContractReadonlyClient } from './preseason02/getPreSeasonTwoBuilderNftContractReadonlyClient';
import { getSeasonOneBuilderNftContractMinterClient } from './season01/getSeasonOneBuilderNftContractMinterClient';
import { getSeasonOneBuilderNftContractReadonlyClient } from './season01/getSeasonOneBuilderNftContractReadonlyClient';

export function getBuilderNftContractReadonlyClient() {
  const season = getCurrentSeasonStart();

  switch (season) {
    case '2025-W18':
      return getSeasonOneBuilderNftContractReadonlyClient();
    case '2025-W02':
      return getPreSeasonTwoBuilderNftContractReadonlyClient();
    default:
      log.debug(`Unsupported season: ${season}`);
      return null;
  }
}

export function getBuilderNftContractMinterClient() {
  const season = getCurrentSeasonStart();

  switch (season) {
    case '2025-W18':
      return getSeasonOneBuilderNftContractMinterClient();
    case '2025-W02':
      return getPreSeasonTwoBuilderNftContractMinterClient();
    default:
      log.debug(`Unsupported season: ${season}`);
      return null;
  }
}
