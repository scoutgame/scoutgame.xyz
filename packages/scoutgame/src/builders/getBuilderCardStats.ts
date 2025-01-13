import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import { normalizeLast14DaysRank } from './utils/normalizeLast14DaysRank';

export type BuilderCardStats = {
  level?: number | null;
  estimatedPayout?: number | null;
  last14DaysRank?: (number | null)[];
};

export async function getBuilderCardStats(builderId: string): Promise<BuilderCardStats> {
  const builder = await prisma.scout.findUniqueOrThrow({
    where: { id: builderId },
    select: {
      userSeasonStats: {
        select: {
          level: true
        }
      },
      builderCardActivities: {
        select: {
          last14Days: true
        }
      },
      builderNfts: {
        where: {
          season: getCurrentSeasonStart()
        },
        select: {
          estimatedPayout: true
        }
      }
    }
  });

  return {
    level: builder.userSeasonStats[0]?.level,
    estimatedPayout: builder.builderNfts[0]?.estimatedPayout,
    last14DaysRank: normalizeLast14DaysRank(builder.builderCardActivities[0])
  };
}
