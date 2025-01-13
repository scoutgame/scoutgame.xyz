import type { BuilderCardActivity } from '@charmverse/core/prisma-client';

import type { Last14DaysRank } from '../interfaces';

export function normalizeLast14DaysRank(
  builderCardActivity: Pick<BuilderCardActivity, 'last7Days'> | undefined
): (number | null)[] {
  return ((builderCardActivity?.last7Days as unknown as Last14DaysRank) || [])
    .map((activity) => activity.rank)
    .slice(-14);
}
