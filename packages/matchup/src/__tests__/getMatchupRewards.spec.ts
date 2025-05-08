import { jest } from '@jest/globals';
import { optimismTokenDecimals } from '@packages/blockchain/constants';
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
  freeRegistration: false,
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
    const { tokenWinners: rewards } = await getMatchupRewards(mockWeek);
    expect(rewards).toEqual([]);
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

    const { tokenWinners: rewards } = await getMatchupRewards(mockWeek);

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
  });

  test('should distribute rewards correctly with a tie for 1st place', async () => {
    const participants = [
      createMockMatchup('scout1', 100, '0x1'),
      createMockMatchup('scout2', 100, '0x2'),
      createMockMatchup('scout3', 80, '0x3'),
      createMockMatchup('scout4', 70, '0x4')
    ];
    (prisma.scoutMatchup.findMany as jest.Mock<typeof prisma.scoutMatchup.findMany>).mockResolvedValue(participants);

    const { tokenWinners: rewards } = await getMatchupRewards(mockWeek);

    // 1st and 2nd place rewards (50% + 30% = 80%) split between 2 winners
    // 3rd place reward (20%) goes to scout3
    const expectedPointsSplit = Math.floor((mockMatchupPool * 0.8) / 2); // 400
    const expectedOpSplit = (parseUnits('60', optimismTokenDecimals) + parseUnits('25', optimismTokenDecimals)) / 2n; // (60 + 25) / 2 = 42.5 OP

    expect(rewards).toHaveLength(3);
    expect(rewards).toContainEqual({
      address: '0x1',
      scoutId: 'scout1',
      devAmount: parseUnits(expectedPointsSplit.toString(), devTokenDecimals),
      opAmount: expectedOpSplit
    });
    expect(rewards).toContainEqual({
      address: '0x2',
      scoutId: 'scout2',
      devAmount: parseUnits(expectedPointsSplit.toString(), devTokenDecimals),
      opAmount: expectedOpSplit
    });
    expect(rewards).toContainEqual({
      address: '0x3',
      scoutId: 'scout3',
      devAmount: parseUnits('200', devTokenDecimals),
      opAmount: parseUnits('15', optimismTokenDecimals)
    }); // 20%
  });

  test('should distribute rewards correctly with a tie for 2nd place', async () => {
    const participants = [
      createMockMatchup('scout1', 100, '0x1'),
      createMockMatchup('scout2', 90, '0x2'),
      createMockMatchup('scout3', 90, '0x3'),
      createMockMatchup('scout4', 80, '0x4')
    ];
    (prisma.scoutMatchup.findMany as jest.Mock<typeof prisma.scoutMatchup.findMany>).mockResolvedValue(participants);

    const { tokenWinners: rewards } = await getMatchupRewards(mockWeek);

    // 1st place reward (50%) goes to scout1
    // 2nd and 3rd place rewards (30% + 20% = 50%) split between 2 winners (scout2, scout3)
    const expectedPointsSplit = Math.floor((mockMatchupPool * 0.5) / 2).toString(); // 250
    const expectedOpSplit = (parseUnits('25', optimismTokenDecimals) + parseUnits('15', optimismTokenDecimals)) / 2n; // (25 + 15) / 2 = 20 OP

    expect(rewards).toHaveLength(3);
    expect(rewards).toContainEqual({
      address: '0x1',
      scoutId: 'scout1',
      devAmount: parseUnits('500', devTokenDecimals),
      opAmount: parseUnits('60', optimismTokenDecimals)
    }); // 50%
    expect(rewards).toContainEqual({
      address: '0x2',
      scoutId: 'scout2',
      devAmount: parseUnits(expectedPointsSplit, devTokenDecimals),
      opAmount: expectedOpSplit
    });
    expect(rewards).toContainEqual({
      address: '0x3',
      scoutId: 'scout3',
      devAmount: parseUnits(expectedPointsSplit, devTokenDecimals),
      opAmount: expectedOpSplit
    });
  });

  test('should distribute rewards correctly with a tie for 3rd place', async () => {
    const participants = [
      createMockMatchup('scout1', 100, '0x1'),
      createMockMatchup('scout2', 90, '0x2'),
      createMockMatchup('scout3', 80, '0x3'),
      createMockMatchup('scout4', 80, '0x4'),
      createMockMatchup('scout5', 70, '0x5')
    ];
    (prisma.scoutMatchup.findMany as jest.Mock<typeof prisma.scoutMatchup.findMany>).mockResolvedValue(participants);

    const { tokenWinners: rewards } = await getMatchupRewards(mockWeek);

    // 1st place (50%), 2nd place (30%)
    // 3rd place reward (20%) split between 2 winners (scout3, scout4)
    const expectedPointsSplit = Math.floor((mockMatchupPool * 0.2) / 2).toString(); // 100
    const expectedOpSplit = parseUnits('15', optimismTokenDecimals) / 2n; // 15 / 2 = 7.5 OP

    expect(rewards).toHaveLength(4);
    expect(rewards).toContainEqual({
      address: '0x1',
      scoutId: 'scout1',
      devAmount: parseUnits('500', devTokenDecimals),
      opAmount: parseUnits('60', optimismTokenDecimals)
    }); // 50%
    expect(rewards).toContainEqual({
      address: '0x2',
      scoutId: 'scout2',
      devAmount: parseUnits('300', devTokenDecimals),
      opAmount: parseUnits('25', optimismTokenDecimals)
    }); // 30%
    expect(rewards).toContainEqual({
      address: '0x3',
      scoutId: 'scout3',
      devAmount: parseUnits(expectedPointsSplit, devTokenDecimals),
      opAmount: expectedOpSplit
    });
    expect(rewards).toContainEqual({
      address: '0x4',
      scoutId: 'scout4',
      devAmount: parseUnits(expectedPointsSplit, devTokenDecimals),
      opAmount: expectedOpSplit
    });
  });

  test('should distribute rewards correctly with a three-way tie for 1st place', async () => {
    const participants = [
      createMockMatchup('scout1', 100, '0x1'),
      createMockMatchup('scout2', 100, '0x2'),
      createMockMatchup('scout3', 100, '0x3'),
      createMockMatchup('scout4', 90, '0x4')
    ];
    (prisma.scoutMatchup.findMany as jest.Mock<typeof prisma.scoutMatchup.findMany>).mockResolvedValue(participants);

    const { tokenWinners: rewards } = await getMatchupRewards(mockWeek);

    // 1st, 2nd, and 3rd place rewards (50% + 30% + 20% = 100%) split between 3 winners
    const expectedPointsSplit = BigInt(mockMatchupPool * 10 ** devTokenDecimals) / BigInt(3); // 333
    const expectedOpSplit = mockOpPool / 3n; // (60 + 25 + 15) / 3 = 33.33... OP

    expect(rewards).toHaveLength(3);
    expect(rewards).toContainEqual({
      address: '0x1',
      scoutId: 'scout1',
      devAmount: expectedPointsSplit,
      opAmount: expectedOpSplit
    });
    expect(rewards).toContainEqual({
      address: '0x2',
      scoutId: 'scout2',
      devAmount: expectedPointsSplit,
      opAmount: expectedOpSplit
    });
    expect(rewards).toContainEqual({
      address: '0x3',
      scoutId: 'scout3',
      devAmount: expectedPointsSplit,
      opAmount: expectedOpSplit
    });
  });

  test('should handle fewer than 3 participants', async () => {
    const participants = [createMockMatchup('scout1', 100, '0x1'), createMockMatchup('scout2', 90, '0x2')];
    (prisma.scoutMatchup.findMany as jest.Mock<typeof prisma.scoutMatchup.findMany>).mockResolvedValue(participants);

    const { tokenWinners: rewards } = await getMatchupRewards(mockWeek);

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

  test('should handle large numbers and potential floating point inaccuracies for points', async () => {
    const largePool = 9999;
    (getMatchupDetails as jest.Mock<typeof getMatchupDetails>).mockResolvedValue({
      matchupPool: largePool
    } as MatchupDetails);
    const participants = [
      createMockMatchup('scout1', 100, '0x1'),
      createMockMatchup('scout2', 100, '0x2'),
      createMockMatchup('scout3', 100, '0x3')
    ];
    (prisma.scoutMatchup.findMany as jest.Mock<typeof prisma.scoutMatchup.findMany>).mockResolvedValue(participants);

    const { tokenWinners: rewards } = await getMatchupRewards(mockWeek);

    // 1st, 2nd, 3rd split (50 + 30 + 20 = 100%)
    const expectedPoints = Math.floor(largePool / 3).toString(); // floor(9999 / 3) = 3333
    const expectedOp = mockOpPool / 3n;

    expect(rewards).toHaveLength(3);
    expect(rewards).toContainEqual({
      address: '0x1',
      scoutId: 'scout1',
      devAmount: parseUnits(expectedPoints, devTokenDecimals),
      opAmount: expectedOp
    });
    expect(rewards).toContainEqual({
      address: '0x2',
      scoutId: 'scout2',
      devAmount: parseUnits(expectedPoints, devTokenDecimals),
      opAmount: expectedOp
    });
    expect(rewards).toContainEqual({
      address: '0x3',
      scoutId: 'scout3',
      devAmount: parseUnits(expectedPoints, devTokenDecimals),
      opAmount: expectedOp
    });
  });
});
