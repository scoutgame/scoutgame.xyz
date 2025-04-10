import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { optimism } from 'viem/chains';

// Mock modules
jest.unstable_mockModule('@charmverse/core/prisma-client', () => ({
  prisma: {
    scoutMatchup: {
      count: jest.fn()
    },
    scout: {
      findUnique: jest.fn()
    },
    partnerRewardPayoutContract: {
      create: jest.fn()
    }
  }
}));

jest.unstable_mockModule('@packages/matchup/getMatchupLeaderboard', () => ({
  getMatchupLeaderboard: jest.fn()
}));

jest.unstable_mockModule('../createSablierAirdropContract', () => ({
  createSablierAirdropContract: jest.fn()
}));

jest.unstable_mockModule('@packages/dates/utils', () => ({
  getCurrentSeason: jest.fn(),
  getCurrentSeasonWeekNumber: jest.fn()
}));

// Import mocked modules
const { getMatchupLeaderboard } = await import('@packages/matchup/getMatchupLeaderboard');
const { createSablierAirdropContract } = await import('../createSablierAirdropContract');
const { getCurrentSeason, getCurrentSeasonWeekNumber } = await import('@packages/dates/utils');
const { deployMatchupRewardsContract } = await import('../deployMatchupRewards');

describe('deployMatchupRewardsContract', () => {
  const mockWeek = '2023-W01';
  const mockSeason = '2023';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getCurrentSeason
    (getCurrentSeason as jest.Mock).mockReturnValue({
      start: mockSeason,
      title: 'Season 1'
    });

    // Mock getCurrentSeasonWeekNumber
    (getCurrentSeasonWeekNumber as jest.Mock).mockReturnValue(1);

    // Mock getMatchupLeaderboard
    (getMatchupLeaderboard as jest.Mock).mockResolvedValue([
      {
        scout: {
          id: 'scout1',
          displayName: 'Scout 1',
          avatar: 'avatar1',
          path: 'scout1'
        },
        rank: 1,
        totalGemsCollected: 100,
        developers: [
          {
            id: 'dev1',
            displayName: 'Dev 1',
            avatar: 'dev1',
            path: 'dev1',
            gemsCollected: 50
          },
          {
            id: 'dev2',
            displayName: 'Dev 2',
            avatar: 'dev2',
            path: 'dev2',
            gemsCollected: 50
          }
        ]
      },
      {
        scout: {
          id: 'scout2',
          displayName: 'Scout 2',
          avatar: 'avatar2',
          path: 'scout2'
        },
        rank: 2,
        totalGemsCollected: 80,
        developers: [
          {
            id: 'dev3',
            displayName: 'Dev 3',
            avatar: 'dev3',
            path: 'dev3',
            gemsCollected: 40
          },
          {
            id: 'dev4',
            displayName: 'Dev 4',
            avatar: 'dev4',
            path: 'dev4',
            gemsCollected: 40
          }
        ]
      },
      {
        scout: {
          id: 'scout3',
          displayName: 'Scout 3',
          avatar: 'avatar3',
          path: 'scout3'
        },
        rank: 3,
        totalGemsCollected: 60,
        developers: [
          {
            id: 'dev5',
            displayName: 'Dev 5',
            avatar: 'dev5',
            path: 'dev5',
            gemsCollected: 30
          },
          {
            id: 'dev6',
            displayName: 'Dev 6',
            avatar: 'dev6',
            path: 'dev6',
            gemsCollected: 30
          }
        ]
      }
    ]);

    // Mock prisma.scoutMatchup.count
    (prisma.scoutMatchup.count as jest.Mock).mockResolvedValue(10);

    // Mock prisma.scout.findUnique
    (prisma.scout.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.id === 'scout1') {
        return Promise.resolve({
          wallets: [{ address: '0x1234567890123456789012345678901234567890' }]
        });
      } else if (where.id === 'scout2') {
        return Promise.resolve({
          wallets: [{ address: '0x2345678901234567890123456789012345678901' }]
        });
      } else if (where.id === 'scout3') {
        return Promise.resolve({
          wallets: [{ address: '0x3456789012345678901234567890123456789012' }]
        });
      }
      return Promise.resolve(null);
    });

    // Mock createSablierAirdropContract
    (createSablierAirdropContract as jest.Mock).mockResolvedValue({
      hash: '0xabcdef1234567890',
      contractAddress: '0x5678901234567890123456789012345678901234',
      cid: 'QmTestCID',
      merkleTree: { root: '0xroot' }
    });

    // Mock prisma.partnerRewardPayoutContract.create
    (prisma.partnerRewardPayoutContract.create as jest.Mock).mockResolvedValue({
      id: 'contract1'
    });
  });

  it('should deploy matchup rewards contract for top 3 winners', async () => {
    // Set environment variable for admin private key
    process.env.MATCHUP_REWARDS_ADMIN_PRIVATE_KEY =
      '0x1234567890123456789012345678901234567890123456789012345678901234';

    // Call the function
    const result = await deployMatchupRewardsContract({ week: mockWeek });

    // Verify the result
    expect(result).toEqual({
      hash: '0xabcdef1234567890',
      contractAddress: '0x5678901234567890123456789012345678901234'
    });

    // Verify getMatchupLeaderboard was called with the correct week
    expect(getMatchupLeaderboard).toHaveBeenCalledWith(mockWeek);

    // Verify prisma.scoutMatchup.count was called with the correct parameters
    expect(prisma.scoutMatchup.count).toHaveBeenCalledWith({
      where: {
        week: mockWeek,
        submittedAt: {
          not: null
        }
      }
    });

    // Verify prisma.scout.findUnique was called for each scout
    expect(prisma.scout.findUnique).toHaveBeenCalledTimes(3);

    // Verify createSablierAirdropContract was called with the correct parameters
    expect(createSablierAirdropContract).toHaveBeenCalledWith({
      adminPrivateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
      campaignName: `Scoutgame Matchup Season 1 Week 1 Rewards`,
      chainId: 10, // optimism.id
      tokenAddress: '0x4200000000000000000000000000000000000042',
      tokenDecimals: 18,
      recipients: [
        { address: '0x1234567890123456789012345678901234567890', amount: 60 },
        { address: '0x2345678901234567890123456789012345678901', amount: 25 },
        { address: '0x3456789012345678901234567890123456789012', amount: 15 }
      ],
      nullAddressAmount: 0.001
    });

    // Verify prisma.partnerRewardPayoutContract.create was called with the correct parameters
    expect(prisma.partnerRewardPayoutContract.create).toHaveBeenCalled();
  });

  it('should handle ties by splitting rewards', async () => {
    // Set environment variable for admin private key
    process.env.MATCHUP_REWARDS_ADMIN_PRIVATE_KEY =
      '0x1234567890123456789012345678901234567890123456789012345678901234';

    // Mock getMatchupLeaderboard to return a tie for first place
    (getMatchupLeaderboard as jest.Mock).mockResolvedValue([
      {
        scout: {
          id: 'scout1',
          displayName: 'Scout 1',
          avatar: 'avatar1',
          path: 'scout1'
        },
        rank: 1,
        totalGemsCollected: 100,
        developers: [
          {
            id: 'dev1',
            displayName: 'Dev 1',
            avatar: 'dev1',
            path: 'dev1',
            gemsCollected: 50
          },
          {
            id: 'dev2',
            displayName: 'Dev 2',
            avatar: 'dev2',
            path: 'dev2',
            gemsCollected: 50
          }
        ]
      },
      {
        scout: {
          id: 'scout2',
          displayName: 'Scout 2',
          avatar: 'avatar2',
          path: 'scout2'
        },
        rank: 1,
        totalGemsCollected: 100,
        developers: [
          {
            id: 'dev3',
            displayName: 'Dev 3',
            avatar: 'dev3',
            path: 'dev3',
            gemsCollected: 50
          },
          {
            id: 'dev4',
            displayName: 'Dev 4',
            avatar: 'dev4',
            path: 'dev4',
            gemsCollected: 50
          }
        ]
      },
      {
        scout: {
          id: 'scout3',
          displayName: 'Scout 3',
          avatar: 'avatar3',
          path: 'scout3'
        },
        rank: 3,
        totalGemsCollected: 60,
        developers: [
          {
            id: 'dev5',
            displayName: 'Dev 5',
            avatar: 'dev5',
            path: 'dev5',
            gemsCollected: 30
          },
          {
            id: 'dev6',
            displayName: 'Dev 6',
            avatar: 'dev6',
            path: 'dev6',
            gemsCollected: 30
          }
        ]
      }
    ]);

    // Call the function
    await deployMatchupRewardsContract({ week: mockWeek });

    // Verify createSablierAirdropContract was called with the correct parameters
    expect(createSablierAirdropContract).toHaveBeenCalledWith({
      adminPrivateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
      campaignName: `Scoutgame Matchup Season 1 Week 1 Rewards`,
      chainId: 10, // optimism.id
      tokenAddress: '0x4200000000000000000000000000000000000042',
      tokenDecimals: 18,
      recipients: [
        { address: '0x1234567890123456789012345678901234567890', amount: 30 }, // 60/2 for tie
        { address: '0x2345678901234567890123456789012345678901', amount: 30 }, // 60/2 for tie
        { address: '0x3456789012345678901234567890123456789012', amount: 15 } // 3rd place
      ],
      nullAddressAmount: 0.001
    });
  });

  it('should skip deployment if no entries are found', async () => {
    // Mock getMatchupLeaderboard to return an empty array
    (getMatchupLeaderboard as jest.Mock).mockResolvedValue([]);

    // Call the function
    await deployMatchupRewardsContract({ week: mockWeek });

    // Verify createSablierAirdropContract was not called
    expect(createSablierAirdropContract).not.toHaveBeenCalled();

    // Verify prisma.partnerRewardPayoutContract.create was not called
    expect(prisma.partnerRewardPayoutContract.create).not.toHaveBeenCalled();
  });

  it('should skip deployment if no valid recipients are found', async () => {
    // Mock prisma.scout.findUnique to return null for all scouts
    (prisma.scout.findUnique as jest.Mock).mockResolvedValue(null);

    // Call the function
    await deployMatchupRewardsContract({ week: mockWeek });

    // Verify createSablierAirdropContract was not called
    expect(createSablierAirdropContract).not.toHaveBeenCalled();

    // Verify prisma.partnerRewardPayoutContract.create was not called
    expect(prisma.partnerRewardPayoutContract.create).not.toHaveBeenCalled();
  });
});
