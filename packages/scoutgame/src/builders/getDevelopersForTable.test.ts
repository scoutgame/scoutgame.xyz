import { prisma } from '@charmverse/core/prisma-client';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

import { getDevelopersForTable } from './getDevelopersForTable';

// Mock prisma
jest.mock('@charmverse/core/prisma-client', () => ({
  prisma: {
    userSeasonStats: {
      findMany: jest.fn()
    },
    builderNft: {
      findMany: jest.fn()
    },
    userWeeklyStats: {
      findMany: jest.fn()
    }
  },
  BuilderNftType: {
    default: 'default',
    starter_pack: 'starter_pack'
  }
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('getDevelopersForTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated developers data for level sorting', async () => {
    // Mock data for level sorting
    const mockData = [
      {
        userId: 'user1',
        level: 5,
        user: {
          path: 'user1-path',
          avatar: 'avatar1',
          displayName: 'User 1',
          builderNfts: [{ currentPrice: BigInt(100), estimatedPayout: 200, nftOwners: [] }],
          builderCardActivities: [{ last14Days: [1, 2, 3] }],
          userWeeklyStats: [{ gemsCollected: 10, rank: 1 }]
        }
      },
      {
        userId: 'user2',
        level: 10,
        user: {
          path: 'user2-path',
          avatar: 'avatar2',
          displayName: 'User 2',
          builderNfts: [{ currentPrice: BigInt(200), estimatedPayout: 300, nftOwners: [] }],
          builderCardActivities: [{ last14Days: [4, 5, 6] }],
          userWeeklyStats: [{ gemsCollected: 20, rank: 2 }]
        }
      }
    ];

    mockedPrisma.userSeasonStats.findMany.mockResolvedValue(mockData as any);

    const result = await getDevelopersForTable({
      limit: 2,
      sortBy: 'level',
      order: 'asc',
      nftType: 'default'
    });

    expect(result.builders).toHaveLength(2);
    expect(result.nextCursor).toEqual({
      id: 'user2',
      value: 10,
      sortType: 'level'
    });
    expect(mockedPrisma.userSeasonStats.findMany).toHaveBeenCalledTimes(1);
  });

  it('should return paginated developers data for price sorting', async () => {
    // Mock data for price sorting
    const mockData = [
      {
        builderId: 'user1',
        currentPrice: BigInt(100),
        estimatedPayout: 200,
        builder: {
          path: 'user1-path',
          avatar: 'avatar1',
          displayName: 'User 1',
          userSeasonStats: [{ level: 5 }],
          builderCardActivities: [{ last14Days: [1, 2, 3] }],
          userWeeklyStats: [{ gemsCollected: 10, rank: 1 }]
        }
      },
      {
        builderId: 'user2',
        currentPrice: BigInt(200),
        estimatedPayout: 300,
        builder: {
          path: 'user2-path',
          avatar: 'avatar2',
          displayName: 'User 2',
          userSeasonStats: [{ level: 10 }],
          builderCardActivities: [{ last14Days: [4, 5, 6] }],
          userWeeklyStats: [{ gemsCollected: 20, rank: 2 }]
        }
      }
    ];

    mockedPrisma.builderNft.findMany.mockResolvedValue(mockData as any);

    const result = await getDevelopersForTable({
      limit: 2,
      sortBy: 'price',
      order: 'asc',
      nftType: 'default',
      cursor: {
        id: 'user1',
        value: '100',
        sortType: 'price'
      }
    });

    expect(result.builders).toHaveLength(2);
    expect(result.nextCursor).toEqual({
      id: 'user2',
      value: '200',
      sortType: 'price'
    });
    expect(mockedPrisma.builderNft.findMany).toHaveBeenCalledTimes(1);
  });

  it('should return paginated developers data for gems collected sorting', async () => {
    // Mock data for week_gems sorting
    const mockData = [
      {
        userId: 'user1',
        gemsCollected: 10,
        rank: 1,
        user: {
          id: 'user1',
          path: 'user1-path',
          avatar: 'avatar1',
          displayName: 'User 1',
          builderNfts: [{ currentPrice: BigInt(100), estimatedPayout: 200, nftOwners: [] }],
          builderCardActivities: [{ last14Days: [1, 2, 3] }],
          userSeasonStats: [{ level: 5 }]
        }
      }
    ];

    mockedPrisma.userWeeklyStats.findMany.mockResolvedValue(mockData as any);

    const result = await getDevelopersForTable({
      limit: 1,
      sortBy: 'week_gems',
      order: 'desc',
      nftType: 'starter',
      cursor: {
        id: 'user0',
        value: 5,
        sortType: 'week_gems'
      }
    });

    expect(result.builders).toHaveLength(1);
    expect(result.nextCursor).toEqual({
      id: 'user1',
      value: 10,
      sortType: 'week_gems'
    });
    expect(mockedPrisma.userWeeklyStats.findMany).toHaveBeenCalledTimes(1);
  });

  it('should handle empty results', async () => {
    mockedPrisma.userSeasonStats.findMany.mockResolvedValue([]);

    const result = await getDevelopersForTable({
      limit: 10,
      sortBy: 'level',
      order: 'asc',
      nftType: 'default'
    });

    expect(result.builders).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
  });
});
