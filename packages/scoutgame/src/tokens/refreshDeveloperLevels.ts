import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import type { DeveloperAggregateScore } from './calculateDeveloperLevels';
import { calculateDeveloperLevels } from './calculateDeveloperLevels';

export async function refreshDeveloperLevels({ season = getCurrentSeasonStart() }: { season?: ISOWeek } = {}): Promise<
  DeveloperAggregateScore[]
> {
  const levels = await calculateDeveloperLevels({ season });

  for (const level of levels) {
    await prisma.userSeasonStats.upsert({
      where: {
        userId_season: {
          userId: level.developerId,
          season
        }
      },
      create: {
        userId: level.developerId,
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
