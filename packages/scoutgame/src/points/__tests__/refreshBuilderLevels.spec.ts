import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getPreviousSeason } from '@packages/dates/utils';
import { seedBuilders, writeSeededBuildersToDatabase } from '@packages/testing/deterministicBuildersData';

import { refreshBuilderLevels } from '../refreshBuilderLevels';

describe.skip('refreshBuilderLevels', () => {
  it('should refresh builder levels in the database', async () => {
    const { builders, weeks } = seedBuilders({ season: getPreviousSeason(getCurrentSeasonStart()) });

    await writeSeededBuildersToDatabase({ builders, season: getPreviousSeason(getCurrentSeasonStart()) });

    // Trigger the function we are testing
    await refreshBuilderLevels({ season: weeks[0] });

    const [builder1, builder2, builder3] = await Promise.all([
      prisma.userSeasonStats.findFirstOrThrow({
        where: {
          userId: builders[0].id
        }
      }),
      prisma.userSeasonStats.findFirstOrThrow({
        where: {
          userId: builders[27].id
        }
      }),
      prisma.userSeasonStats.findFirstOrThrow({
        where: {
          userId: builders[170].id
        }
      })
    ]);

    // These numbers were obtained by checking the seed data results once, then ensuring they don't change
    expect(builder1.level).toBe(7);
    expect(builder2.level).toBe(8);
    expect(builder3.level).toBe(5);
  });
});
