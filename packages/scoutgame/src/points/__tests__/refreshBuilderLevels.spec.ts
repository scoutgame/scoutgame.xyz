import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import {
  seedBuildersGemPayouts,
  writeSeededBuildersGemPayoutsToDatabase
} from '@packages/testing/deterministicBuildersGemPayoutsData';

import { refreshBuilderLevels } from '../refreshBuilderLevels';

jest.useFakeTimers();

describe('refreshBuilderLevels', () => {
  beforeEach(() => {
    jest.setSystemTime(new Date('2025-01-25'));
  });

  it('should refresh builder levels in the database', async () => {
    const season = '2024-W41';

    const { builders } = seedBuildersGemPayouts({
      season,
      amount: 200
    });

    await writeSeededBuildersGemPayoutsToDatabase({ builders, season });

    const builder0 = builders[0];
    const builder27 = builders[27];
    const builder170 = builders[170];

    // Trigger the function we are testing
    await refreshBuilderLevels({ season });

    const [builder1, builder2, builder3] = await Promise.all([
      prisma.userSeasonStats.findFirstOrThrow({
        where: {
          userId: builder0.id
        }
      }),
      prisma.userSeasonStats.findFirstOrThrow({
        where: {
          userId: builder27.id
        }
      }),
      prisma.userSeasonStats.findFirstOrThrow({
        where: {
          userId: builder170.id
        }
      })
    ]);

    // These numbers were obtained by checking the seed data results once, then ensuring they don't change
    expect(builder1.level).toBe(8);
    expect(builder2.level).toBe(10);
    expect(builder3.level).toBe(5);
  });
});
