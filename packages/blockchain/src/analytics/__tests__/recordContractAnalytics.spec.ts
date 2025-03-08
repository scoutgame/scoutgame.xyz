import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { mockScoutProject } from '@packages/testing/database';
import { randomWalletAddress } from '@packages/testing/generators';
import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';

// Mock modules before importing the function under test
jest.unstable_mockModule('@packages/dune/queries', () => ({
  getEvmAddressStats: jest.fn(),
  getSolanacontractstats: jest.fn()
}));

jest.unstable_mockModule('../getTransactionStats', () => ({
  getContractTransactionStats: jest.fn()
}));

const { getEvmAddressStats, getSolanacontractstats } = await import('@packages/dune/queries');

const { getContractTransactionStats } = await import('../getTransactionStats');
const { recordContractAnalytics } = await import('../recordContractAnalytics');

describe('recordContractAnalytics', () => {
  const startDate = new Date('2023-01-01T00:00:00Z');
  const endDate = new Date('2023-01-07T23:59:59Z');
  const now = new Date('2023-01-06T16:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a daily stat for every date even if there are no metrics returned from getEvmAddressStats', async () => {
    const project = await mockScoutProject({
      contracts: [randomWalletAddress()]
    });
    const mockContract = project.contracts[0]!;

    (getEvmAddressStats as jest.Mock).mockResolvedValue([]);
    await recordContractAnalytics(mockContract, startDate, endDate, now);

    const createdStats = await prisma.scoutProjectContractDailyStats.findMany({
      where: { contractId: mockContract.id },
      orderBy: {
        day: 'asc'
      }
    });

    // Expect 7 days of stats to be created
    expect(createdStats.length).toBe(7);
    expect(createdStats.every((stat) => stat.transactions === 0)).toBe(true);
  });

  it('should capture dailyStats returned from getEvmAddressStats', async () => {
    const project = await mockScoutProject({
      contracts: [randomWalletAddress()]
    });
    const mockContract = project.contracts[0]!;
    const mockStats = [
      { day: new Date('2023-01-01T00:00:00Z'), transactions: 5, accounts: 3, gasFees: '0.1' },
      { day: new Date('2023-01-02T00:00:00Z'), transactions: 10, accounts: 5, gasFees: '0.2' }
    ];

    (getEvmAddressStats as jest.Mock).mockResolvedValue(mockStats);

    await recordContractAnalytics(mockContract, startDate, endDate, now);

    const createdStats = await prisma.scoutProjectContractDailyStats.findMany({
      where: { contractId: mockContract.id },
      orderBy: {
        day: 'asc'
      }
    });

    // Expect the stats to match the mock stats
    expect(createdStats.length).toBe(7);
    expect(createdStats[0].transactions).toBe(5);
    expect(createdStats[1].transactions).toBe(10);
  });

  it('should capture dailyStats returned from getContractTransactionStats', async () => {
    const project = await mockScoutProject({
      contracts: [randomWalletAddress()]
    });
    const mockContract = project.contracts[0]!;
    const mockStats = [{ day: new Date('2023-01-03T00:00:00Z'), transactions: 7, accounts: 4, gasFees: '0.3' }];

    (getEvmAddressStats as jest.Mock).mockResolvedValue(mockStats);

    await recordContractAnalytics(mockContract, startDate, endDate, now);

    const createdStats = await prisma.scoutProjectContractDailyStats.findMany({
      where: { contractId: mockContract.id },
      orderBy: {
        day: 'asc'
      }
    });
    // Expect the stats to match the mock stats
    expect(createdStats.length).toBe(7);
    expect(createdStats[2].transactions).toBe(7);
  });

  it('should update the stats already created today', async () => {
    const project = await mockScoutProject({
      contracts: [randomWalletAddress()]
    });
    const mockContract = project.contracts[0]!;
    const existingStat = {
      day: new Date('2023-01-01T00:00:00Z'),
      transactions: 0,
      accounts: 0,
      gasFees: '0',
      week: '2025-W02'
    };

    // Create an existing stat in the database
    await prisma.scoutProjectContractDailyStats.create({
      data: {
        contractId: mockContract.id,
        ...existingStat
      }
    });

    const updatedStats = [{ day: existingStat.day, transactions: 3, accounts: 1, gasFees: '0.05' }];

    (getEvmAddressStats as jest.Mock).mockResolvedValue(updatedStats);

    await recordContractAnalytics(mockContract, startDate, endDate, now);

    const createdStats = await prisma.scoutProjectContractDailyStats.findMany({
      where: { contractId: mockContract.id },
      orderBy: {
        day: 'asc'
      }
    });

    // Expect the existing stat to be updated
    expect(createdStats.length).toBe(7);
    expect(createdStats[0].transactions).toBe(3); // Updated value
  });
});
