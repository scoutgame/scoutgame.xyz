import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import { mockScout } from '../../testing/database';
import type { ScoutsSortBy } from '../getScouts';
import { getScouts } from '../getScouts';

describe('getScouts', () => {
  const mockSeason = '2024-01';

  beforeAll(async () => {
    await Promise.all([
      mockScout({
        path: 'scout1',
        season: mockSeason,
        stats: {
          season: {
            pointsEarnedAsScout: 100,
            nftsPurchased: 5
          }
        }
      }),
      mockScout({
        path: 'scout2',
        season: mockSeason,
        stats: {
          season: {
            pointsEarnedAsScout: 200,
            nftsPurchased: 3
          }
        }
      }),
      mockScout({
        path: 'scout3',
        season: mockSeason,
        stats: {
          season: {
            pointsEarnedAsScout: 150,
            nftsPurchased: 8
          }
        }
      })
    ]);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function testSort(sortBy: ScoutsSortBy, order: 'asc' | 'desc', expectedOrder: string[]) {
    const result = await getScouts({ season: mockSeason, sortBy, order });

    // Verify the order of results matches expected
    expect(result.map((scout) => scout.path)).toEqual(expectedOrder);
  }

  it('should sort by points ascending', async () => {
    await testSort('points', 'asc', ['scout1', 'scout3', 'scout2']);
  });

  it('should sort by points descending', async () => {
    await testSort('points', 'desc', ['scout2', 'scout3', 'scout1']);
  });

  it('should sort by rank ascending', async () => {
    await testSort('rank', 'asc', ['scout2', 'scout3', 'scout1']);
  });

  it('should sort by rank descending', async () => {
    await testSort('rank', 'desc', ['scout1', 'scout3', 'scout2']);
  });

  it('should sort by cards ascending', async () => {
    await testSort('cards', 'asc', ['scout2', 'scout1', 'scout3']);
  });

  it('should sort by cards descending', async () => {
    await testSort('cards', 'desc', ['scout3', 'scout1', 'scout2']);
  });

  it('should sort by builders ascending', async () => {
    await testSort('builders', 'asc', ['scout2', 'scout1', 'scout3']);
  });

  it('should sort by builders descending', async () => {
    await testSort('builders', 'desc', ['scout3', 'scout1', 'scout2']);
  });

  it('should return an empty array for invalid sort type', async () => {
    const result = await getScouts({ sortBy: 'invalid' as ScoutsSortBy });
    expect(result).toEqual([]);
  });

  it('should respect the limit parameter', async () => {
    const result = await getScouts({ limit: 2 });
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('should filter out deleted users', async () => {
    const scout4 = await mockScout({
      path: 'scout4',
      season: mockSeason,
      stats: {
        season: {
          pointsEarnedAsScout: 100,
          nftsPurchased: 5
        }
      }
    });
    const originalResult = await getScouts({ season: mockSeason });
    // soft-delete the user
    await prisma.scout.update({
      where: {
        id: scout4.id
      },
      data: {
        deletedAt: new Date()
      }
    });
    expect((await getScouts({ season: mockSeason })).length).toBe(originalResult.length - 1);
  });

  it('a scout from a different season should not be included', async () => {
    const scout4 = await mockScout({
      path: 'scout4',
      season: '2023-01',
      stats: {
        season: {
          pointsEarnedAsScout: 100,
          nftsPurchased: 5
        }
      }
    });
    const results = await getScouts({ season: mockSeason });
    expect(results.map((scout) => scout.path)).not.toContain(scout4.path);
  });
});
