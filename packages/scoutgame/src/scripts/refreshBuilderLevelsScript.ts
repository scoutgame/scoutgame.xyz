import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { refreshBuilderLevels } from '@packages/scoutgame/points/refreshBuilderLevels';

async function script() {
  const levels = await refreshBuilderLevels();

  const levelZeroBuilders = await prisma.userSeasonStats.updateMany({
    where: {
      season: getCurrentSeasonStart(),
      userId: {
        notIn: levels.map((level) => level.builderId)
      }
    },
    data: {
      level: 0
    }
  });
}