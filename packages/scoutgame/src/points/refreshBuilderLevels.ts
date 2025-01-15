import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import { calculateBuilderLevels } from './calculateBuilderLevel';

export async function refreshBuilderLevels({ season = getCurrentSeasonStart() }: { season?: ISOWeek }) {
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

  const levelZeroBuilders = await prisma.userSeasonStats.updateMany({
    where: {
      season,
      userId: {
        notIn: levels.map((level) => level.builderId)
      }
    },
    data: {
      level: 0
    }
  });

  log.info(
    `Refreshed builder levels for season ${season}. Ranked ${levels.length} builders and zeroed out ${levelZeroBuilders.count} unranked builders`
  );
}
