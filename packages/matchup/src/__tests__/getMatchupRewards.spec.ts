import { jest } from '@jest/globals';
import { optimismTokenDecimals } from '@packages/blockchain/constants';
import { getNextWeek } from '@packages/dates/utils';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import type { Scout, ScoutMatchup, ScoutWallet } from '@prisma/client';
import { parseUnits } from 'viem';
import type { Address } from 'viem';

import type { MatchupDetails } from '../getMatchupDetails';

// Mock the prisma client and getMatchupDetails
jest.unstable_mockModule('@charmverse/core/prisma-client', () => ({
  prisma: {
    scoutMatchup: {
      findMany: jest.fn()
    }
  }
}));

jest.unstable_mockModule('../getMatchupDetails', () => ({
  getMatchupDetails: jest.fn()
}));

// Dynamically import after mocks are set up
const { prisma } = await import('@charmverse/core/prisma-client');
const { getMatchupDetails } = await import('../getMatchupDetails');
const { getMatchupRewards } = await import('../getMatchupRewards');

// Helper function to create mock scout matchup data
const createMockMatchup = (
  createdBy: string,
  totalScore: number,
  address?: Address
): ScoutMatchup & {
  scout: { wallets: Pick<ScoutWallet, 'address'>[] };
} => ({
  createdBy,
  totalScore,
  decentRegistrationTxId: null,
  freeRegistration: false,
  registrationTxId: null,
  submittedAt: new Date(),
  rank: 1,
  id: '1',
  week: '2024-01',
  createdAt: new Date(),
  scout: {
    wallets: address ? [{ address }] : []
  }
});

describe('getMatchupRewards', () => {
  const mockWeek = '2024-01';
  const mockMatchupPool = 1000; // Example pool size
  const mockOpPool = parseUnits('100', optimismTokenDecimals); // 60 + 25 + 15

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    (getMatchupDetails as jest.Mock<typeof getMatchupDetails>).mockResolvedValue({
      matchupPool: mockMatchupPool
    } as MatchupDetails);
  });

  test('should return empty array if no participants', async () => {
    (prisma.scoutMatchup.findMany as jest.Mock<typeof prisma.scoutMatchup.findMany>).mockResolvedValue([]);
    const { tokenWinners: rewards, freeMatchupWinners } = await getMatchupRewards(mockWeek);
    expect(rewards).toEqual([]);
    expect(freeMatchupWinners).toEqual([]);
    expect(getMatchupDetails).toHaveBeenCalledWith(mockWeek);
  });

  test('should distribute rewards correctly for top 3 distinct scores', async () => {
    const participants = [
      createMockMatchup('scout1', 100, '0x1'),
      createMockMatchup('scout2', 90, '0x2'),
      createMockMatchup('scout3', 80, '0x3'),
      createMockMatchup('scout4', 70, '0x4') // Should not receive reward
    ];
    (prisma.scoutMatchup.findMany as jest.Mock<typeof prisma.scoutMatchup.findMany>).mockResolvedValue(participants);

    const { tokenWinners: rewards, freeMatchupWinners } = await getMatchupRewards(mockWeek);

    expect(rewards).toHaveLength(3);
    expect(rewards).toEqual([
      {
        address: '0x1',
        scoutId: 'scout1',
        devAmount: parseUnits('500', devTokenDecimals),
        opAmount: parseUnits('60', optimismTokenDecimals)
      }, // 50%
      {
        address: '0x2',
        scoutId: 'scout2',
        devAmount: parseUnits('300', devTokenDecimals),
        opAmount: parseUnits('25', optimismTokenDecimals)
      }, // 30%
      {
        address: '0x3',
        scoutId: 'scout3',
        devAmount: parseUnits('200', devTokenDecimals),
        opAmount: parseUnits('15', optimismTokenDecimals)
      } // 20%
    ]);
    expect(freeMatchupWinners).toHaveLength(1);
  });

  test('should distribute rewards correctly with a tie for 1st place', async () => {
    const participants = [
      createMockMatchup('scout1', 100, '0x1'),
      createMockMatchup('scout2', 100, '0x2'),
      createMockMatchup('scout3', 80, '0x3'),
      createMockMatchup('scout4', 70, '0x4')
    ];
    (prisma.scoutMatchup.findMany as jest.Mock<typeof prisma.scoutMatchup.findMany>).mockResolvedValue(participants);

    const { tokenWinners: rewards, freeMatchupWinners } = await getMatchupRewards(mockWeek);

    // 1st and 2nd place rewards (50% + 30% = 80%) split between 2 winners
    // 3rd place reward (20%) goes to scout3
    // In case of a tie, the first entry (by createdAt) gets the higher position
    // So scout1 gets 1st place, scout2 gets 2nd place, scout3 gets 3rd place
    expect(rewards).toHaveLength(3);
    expect(rewards).toEqual([
      {
        address: '0x1',
        scoutId: 'scout1',
        devAmount: parseUnits('500', devTokenDecimals),
        opAmount: parseUnits('60', optimismTokenDecimals)
      }, // 50%
      {
        address: '0x2',
        scoutId: 'scout2',
        devAmount: parseUnits('300', devTokenDecimals),
        opAmount: parseUnits('25', optimismTokenDecimals)
      }, // 30%
      {
        address: '0x3',
        scoutId: 'scout3',
        devAmount: parseUnits('200', devTokenDecimals),
        opAmount: parseUnits('15', optimismTokenDecimals)
      } // 20%
    ]);

    expect(freeMatchupWinners).toEqual([
      {
        address: '0x4',
        scoutId: 'scout4',
        week: getNextWeek(mockWeek)
      }
    ]);
  });

  test('should distribute free matchup rewards to 4th and 5th place', async () => {
    const participants = [
      createMockMatchup('scout1', 100, '0x1'),
      createMockMatchup('scout2', 100, '0x2'),
      createMockMatchup('scout3', 80, '0x3'),
      createMockMatchup('scout4', 70, '0x4'),
      createMockMatchup('scout5', 60, '0x5')
    ];
    (prisma.scoutMatchup.findMany as jest.Mock<typeof prisma.scoutMatchup.findMany>).mockResolvedValue(participants);

    const { tokenWinners: rewards, freeMatchupWinners } = await getMatchupRewards(mockWeek);

    expect(rewards).toHaveLength(3);
    expect(freeMatchupWinners).toEqual([
      {
        address: '0x4',
        scoutId: 'scout4',
        week: getNextWeek(mockWeek)
      },
      {
        address: '0x5',
        scoutId: 'scout5',
        week: getNextWeek(mockWeek)
      }
    ]);
  });

  test('should handle fewer than 3 participants', async () => {
    const participants = [createMockMatchup('scout1', 100, '0x1'), createMockMatchup('scout2', 90, '0x2')];
    (prisma.scoutMatchup.findMany as jest.Mock<typeof prisma.scoutMatchup.findMany>).mockResolvedValue(participants);

    const { tokenWinners: rewards, freeMatchupWinners } = await getMatchupRewards(mockWeek);

    expect(rewards).toHaveLength(2);
    expect(rewards).toEqual([
      {
        address: '0x1',
        scoutId: 'scout1',
        devAmount: parseUnits('500', devTokenDecimals),
        opAmount: parseUnits('60', optimismTokenDecimals)
      }, // 50%
      {
        address: '0x2',
        scoutId: 'scout2',
        devAmount: parseUnits('300', devTokenDecimals),
        opAmount: parseUnits('25', optimismTokenDecimals)
      } // 30%
    ]);

    expect(freeMatchupWinners).toHaveLength(0);
  });

  test('should skip participants without a primary wallet', async () => {
    const participants = [
      createMockMatchup('scout1', 100, '0x1'),
      createMockMatchup('scout2', 90), // No wallet address
      createMockMatchup('scout3', 80, '0x3'),
      createMockMatchup('scout4', 70, '0x4') // Does not receive reward
    ];
    (prisma.scoutMatchup.findMany as jest.Mock<typeof prisma.scoutMatchup.findMany>).mockResolvedValue(participants);

    const { tokenWinners: rewards } = await getMatchupRewards(mockWeek);

    expect(rewards).toHaveLength(2);
    expect(rewards).toEqual([
      {
        address: '0x1',
        scoutId: 'scout1',
        devAmount: parseUnits('500', devTokenDecimals),
        opAmount: parseUnits('60', optimismTokenDecimals)
      }, // 1st
      {
        address: '0x3',
        scoutId: 'scout3',
        devAmount: parseUnits('200', devTokenDecimals),
        opAmount: parseUnits('15', optimismTokenDecimals)
      } // 2nd (scout2 skipped)
    ]);
  });
});
