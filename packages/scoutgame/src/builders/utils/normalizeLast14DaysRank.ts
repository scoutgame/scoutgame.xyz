import type { BuilderCardActivity } from '@charmverse/core/prisma-client';

import type { last14DaysRank } from '../interfaces';

export function normalizeLast14DaysRank(
  builderCardActivity: Pick<BuilderCardActivity, 'last7Days'> | undefined
): number[] {
  return ((builderCardActivity?.last7Days as unknown as last14DaysRank) || []).map((gem) => gem.rank).slice(-14);
}
