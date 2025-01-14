import type { BuilderCardActivity } from '@charmverse/core/prisma-client';

import type { Last14DaysRank } from '../interfaces';

export function normalizeLast14DaysRank(
  builderCardActivity: Pick<BuilderCardActivity, 'last14Days'> | undefined
): (number | null)[] {
  return ((builderCardActivity?.last14Days as unknown as Last14DaysRank) || [])
    .map((activity) => activity.rank)
    .slice(-14);
}
