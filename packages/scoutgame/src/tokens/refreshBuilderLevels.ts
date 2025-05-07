import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import type { BuilderAggregateScore } from './calculateDeveloperLevels';
import { calculateBuilderLevels } from './calculateDeveloperLevels';

export async function refreshBuilderLevels({ season = getCurrentSeasonStart() }: { season?: ISOWeek } = {}): Promise<
  BuilderAggregateScore[]
> {
  const levels = await calculateBuilderLevels({ season });

  for (const level of levels) {
    await prisma.userSeasonStats.upsert({
      where: {
        userId_season: {
          userId: level.builderId,
          season
        }
      },
      create: {
        userId: level.builderId,
        season,
        level: level.level
      },
      update: {
        level: level.level
      }
    });
  }

  return levels;
}
