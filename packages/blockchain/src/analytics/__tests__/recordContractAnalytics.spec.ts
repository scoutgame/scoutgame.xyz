import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';

// Mock modules before importing the function under test
jest.unstable_mockModule('@packages/dune/queries', () => ({
  getEvmAddressStats: jest.fn(),
  getSolanaWalletStats: jest.fn()
}));

jest.unstable_mockModule('../getTransactionStats', () => ({
  getContractTransactionStats: jest.fn()
}));

const { getEvmAddressStats, getSolanaWalletStats } = await import('@packages/dune/queries');

const { getContractTransactionStats } = await import('../getTransactionStats');
const { recordContractAnalytics } = await import('../recordContractAnalytics');

describe('recordContractAnalytics', () => {
  const mockWallet = {
    id: uuid(),
    address: '0x1234567890abcdef',
    chainId: 1 // Assuming this is the chain ID for Ethereum
  };

  const startDate = new Date('2023-01-01');
  const endDate = new Date('2023-01-07');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a daily stat for every date even if there are no metrics returned from getEvmAddressStats', async () => {
    await recordContractAnalytics(mockWallet, startDate, endDate);

    const createdStats = await prisma.scoutProjectContractDailyStats.findMany({
      where: { contractId: mockWallet.id }
    });

    // Expect 7 days of stats to be created
    expect(createdStats.length).toBe(7);
    expect(createdStats.every((stat) => stat.transactions === 0)).toBe(true);
  });

  it('should capture dailyStats returned from getEvmAddressStats', async () => {
    const mockStats = [
      { day: new Date('2023-01-01'), transactions: 5, accounts: 3, gasFees: '0.1' },
      { day: new Date('2023-01-02'), transactions: 10, accounts: 5, gasFees: '0.2' }
    ];

    await recordContractAnalytics(mockWallet, startDate, endDate);

    const createdStats = await prisma.scoutProjectContractDailyStats.findMany({
      where: { contractId: mockWallet.id }
    });

    // Expect the stats to match the mock stats
    expect(createdStats.length).toBe(2);
    expect(createdStats[0].transactions).toBe(5);
    expect(createdStats[1].transactions).toBe(10);
  });

  it('should capture dailyStats returned from getContractTransactionStats', async () => {
    const mockStats = [{ day: new Date('2023-01-03'), transactions: 7, accounts: 4, gasFees: '0.3' }];

    await recordContractAnalytics(mockWallet, startDate, endDate);

    const createdStats = await prisma.scoutProjectContractDailyStats.findMany({
      where: { contractId: mockWallet.id }
    });

    // Expect the stats to match the mock stats
    expect(createdStats.length).toBe(1);
    expect(createdStats[0].transactions).toBe(7);
  });

  it('should update the stats already created today', async () => {
    const existingStat = {
      day: new Date('2023-01-01'),
      transactions: 0,
      accounts: 0,
      gasFees: '0'
    };

    // Create an existing stat in the database
    await prisma.scoutProjectContractDailyStats.create({
      data: {
        contractId: mockWallet.id,
        ...existingStat
      }
    });

    const updatedStats = [{ day: existingStat.day, transactions: 3, accounts: 1, gasFees: '0.05' }];

    await recordContractAnalytics(mockWallet, startDate, endDate);

    const createdStats = await prisma.scoutProjectContractDailyStats.findMany({
      where: { contractId: mockWallet.id }
    });

    // Expect the existing stat to be updated
    expect(createdStats.length).toBe(1);
    expect(createdStats[0].transactions).toBe(3); // Updated value
  });
});
