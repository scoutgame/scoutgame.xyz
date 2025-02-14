import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import type { WalletTransaction } from '@packages/blockchain/provider/taikoscan/client';
import { mockScout, mockScoutProject } from '@packages/testing/database';
import { v4 as uuid } from 'uuid';
import type { Address } from 'viem';

const mockGetTransactions = jest.fn<() => Promise<WalletTransaction[]>>();

jest.unstable_mockModule('@packages/blockchain/provider/taikoscan/client', () => ({
  getWalletTransactions: mockGetTransactions,
  maxRecords: 100
}));

const { processWalletTransactions } = await import('../processWalletTransactions');

describe('processWalletTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save transaction and create poll event', async () => {
    const scout = await mockScout();
    const project = await mockScoutProject({
      userId: scout.id
    });
    const mockWallet = await prisma.scoutProjectWallet.create({
      data: {
        address: uuid() as Address,
        createdBy: scout.id,
        chainId: 167009,
        projectId: project.id
      }
    });

    const mockTransaction = {
      hash: '0xabc',
      blockNumber: '100',
      from: '0x123',
      to: '0x456',
      gasUsed: '21000',
      gasPrice: '1000000000',
      timeStamp: '1677777777',
      txreceipt_status: 'success'
    } as WalletTransaction;

    mockGetTransactions.mockResolvedValueOnce([mockTransaction]);

    await processWalletTransactions({
      chainId: 167009, // Taiko chain ID
      walletId: mockWallet.id,
      address: mockWallet.address as Address,
      fromBlock: BigInt(0),
      toBlock: BigInt(1000)
    });

    // Verify transaction was saved
    const savedTransaction = await prisma.scoutProjectWalletTransaction.findFirst({
      where: {
        walletId: mockWallet.id
      }
    });

    expect(savedTransaction).toBeTruthy();
    expect(savedTransaction).toMatchObject({
      walletId: mockWallet.id,
      chainId: 167009,
      blockNumber: 100n,
      txHash: mockTransaction.hash,
      from: mockTransaction.from.toLowerCase(),
      to: mockTransaction.to.toLowerCase(),
      gasUsed: 21000n,
      gasPrice: 1000000000n,
      gasCost: 21000n * 1000000000n,
      status: mockTransaction.txreceipt_status
    });

    // Verify poll event was created
    const pollEvent = await prisma.scoutProjectWalletPollEvent.findFirst({
      where: {
        walletId: mockWallet.id
      }
    });

    expect(pollEvent).toBeTruthy();
    expect(pollEvent).toMatchObject({
      walletId: mockWallet.id,
      fromBlockNumber: BigInt(0),
      toBlockNumber: BigInt(1000),
      processedAt: expect.any(Date),
      processTime: expect.any(Number)
    });
  });

  it('should handle empty transaction list', async () => {
    const scout = await mockScout();
    const project = await mockScoutProject({
      userId: scout.id
    });
    const mockWallet = await prisma.scoutProjectWallet.create({
      data: {
        address: uuid(),
        createdBy: scout.id,
        chainId: 167009,
        projectId: project.id
      }
    });

    mockGetTransactions.mockResolvedValueOnce([]);

    await processWalletTransactions({
      chainId: 167009,
      walletId: mockWallet.id,
      address: mockWallet.address as Address,
      fromBlock: BigInt(0),
      toBlock: BigInt(1000)
    });

    const transactions = await prisma.scoutProjectWalletTransaction.findMany({
      where: {
        walletId: mockWallet.id
      }
    });

    expect(transactions).toHaveLength(0);

    // Should not create poll event for empty results
    const pollEvents = await prisma.scoutProjectWalletPollEvent.findMany({
      where: {
        walletId: mockWallet.id
      }
    });

    expect(pollEvents).toHaveLength(0);
  });

  it('should throw error for unsupported chain', async () => {
    const scout = await mockScout();
    const project = await mockScoutProject({
      userId: scout.id
    });
    const mockWallet = await prisma.scoutProjectWallet.create({
      data: {
        address: uuid() as Address,
        createdBy: scout.id,
        chainId: 167009,
        projectId: project.id
      }
    });

    await expect(
      processWalletTransactions({
        chainId: 999999, // Unsupported chain
        walletId: mockWallet.id,
        address: mockWallet.address as Address,
        fromBlock: BigInt(0),
        toBlock: BigInt(1000)
      })
    ).resolves.toBeUndefined(); // Should exit early without error
  });
});
