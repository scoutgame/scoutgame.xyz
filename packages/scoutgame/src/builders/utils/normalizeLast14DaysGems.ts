import type { BuilderCardActivity } from '@charmverse/core/prisma-client';

import type { Last14DaysGems } from '../interfaces';

export function normalizeLast14DaysGems(
  builderCardActivity: Pick<BuilderCardActivity, 'last14Days'> | undefined
): number[] {
  return ((builderCardActivity?.last14Days as unknown as Last14DaysGems) || []).map((gem) => gem.gemsCount).slice(-14);
}
