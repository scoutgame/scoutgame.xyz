import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { mockBuilder, mockBuilderNft } from '@packages/testing/database';
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

  it('should refresh builder levels in the database and zero out unranked builders', async () => {
    const season = '2024-W41';

    const mockBuilderUser = await mockBuilder({});

    await prisma.userSeasonStats.upsert({
      where: {
        userId_season: {
          userId: mockBuilderUser.id,
          season
        }
      },
      create: {
        userId: mockBuilderUser.id,
        season,
        level: 8
      },
      update: {
        level: 8
      }
    });

    const mockedBuilderUserNft = await mockBuilderNft({
      season,
      builderId: mockBuilderUser.id,
      nftType: 'default'
    });

    const { builders, weeks } = seedBuildersGemPayouts({
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

    const mockBuilderUserStatsAfter = await prisma.userSeasonStats.findFirstOrThrow({
      where: {
        userId: mockBuilderUser.id
      }
    });

    expect(mockBuilderUserStatsAfter.level).toBe(0);
  });
});
