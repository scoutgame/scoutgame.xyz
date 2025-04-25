import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { getPreviousWeek } from '@packages/dates/utils';
import { mockBuilder, mockUserWeeklyStats } from '@packages/testing/database';

const mockSeason = `2020-W01${Math.random()}`;

// mock the getCurrentSeason function
jest.unstable_mockModule('@packages/dates/utils', () => ({
  getCurrentWeek: jest.fn(() => '2020-W40'),
  getPreviousWeek: jest.fn(() => '2020-W39'),
  getCurrentSeason: jest.fn(() => ({ start: mockSeason })),
  getCurrentSeasonStart: jest.fn(() => mockSeason),
  getSeasonConfig: jest.fn(() => ({
    gemsPerRank: 10
  }))
}));

const { getTodaysHotBuilders } = await import('../getTodaysHotBuilders');

describe('getTodaysHotBuilders', () => {
  afterEach(async () => {
    await prisma.scout.deleteMany({
      where: {
        builderNfts: {
          some: {
            season: mockSeason
          }
        }
      }
    });
  });

  it('should filter banned builders and return current and previous week builders', async () => {
    const week = '2020-W40';
    const currentWeekBuilders = await Promise.all([
      mockBuilder({ nftSeason: mockSeason, createNft: true }),
      mockBuilder({
        builderStatus: 'banned'
      }),
      mockBuilder({ nftSeason: mockSeason, createNft: true })
    ]);
    const previousWeekBuilders = await Promise.all([
      mockBuilder({ nftSeason: mockSeason, createNft: true }),
      mockBuilder({ nftSeason: mockSeason, createNft: true }),
      mockBuilder({
        builderStatus: 'banned'
      })
    ]);

    await Promise.all(
      currentWeekBuilders.map((builder, index) =>
        mockUserWeeklyStats({
          userId: builder.id,
          week,
          rank: index + 1,
          season: mockSeason,
          gemsCollected: 10
        })
      )
    );

    await Promise.all(
      previousWeekBuilders.map((builder, index) =>
        mockUserWeeklyStats({
          userId: builder.id,
          week: getPreviousWeek(week),
          rank: index + 1,
          gemsCollected: 5,
          season: mockSeason
        })
      )
    );

    const result = await getTodaysHotBuilders({ week });
    expect(result).toHaveLength(4);
    expect(result[0].id).toBe(currentWeekBuilders[0].id);
    expect(result[1].id).toBe(currentWeekBuilders[2].id);
    expect(result[2].id).toBe(previousWeekBuilders[0].id);
    expect(result[3].id).toBe(previousWeekBuilders[1].id);
  });

  it('should skip builders with no gems collected in current week', async () => {
    const currentWeekBuilder = await mockBuilder({ createNft: true, nftSeason: mockSeason });
    const previousWeekBuilder = await mockBuilder({ createNft: true, nftSeason: mockSeason });
    const week = '2022-W32';
    await mockUserWeeklyStats({
      userId: currentWeekBuilder.id,
      week,
      rank: 1,
      gemsCollected: 0
    });
    await mockUserWeeklyStats({
      userId: previousWeekBuilder.id,
      week,
      rank: 1,
      gemsCollected: 5
    });

    const result = await getTodaysHotBuilders({ week });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(previousWeekBuilder.id);
  });
});
