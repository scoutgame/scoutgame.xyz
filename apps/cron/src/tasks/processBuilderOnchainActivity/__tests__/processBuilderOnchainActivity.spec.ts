import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import type { GetLogsResult, GetTransactionReceiptResult } from '@packages/blockchain/provider/ankr/client';
import { mockScoutProject } from '@packages/testing/database';
import { randomWalletAddress } from '@packages/testing/generators';
import { createContext } from '@packages/testing/koa/context';
import type { Block } from 'viem';

const mockGetLogs = jest.fn<() => Promise<GetLogsResult>>();
const mockGetTransactionReceipt = jest.fn<() => Promise<GetTransactionReceiptResult>>();
const mockGetBlock = jest.fn<() => Promise<Block>>();
jest.unstable_mockModule('@packages/blockchain/getBlockByDate', () => ({
  getBlockByDate: () => Promise.resolve({ number: 100n })
}));

jest.unstable_mockModule('@packages/blockchain/getPublicClient', () => ({
  getPublicClient: () => ({
    getBlockNumber: () => Promise.resolve(101n)
  })
}));

jest.unstable_mockModule('@packages/blockchain/provider/ankr/client', () => ({
  getLogs: mockGetLogs,
  getTransactionReceipt: mockGetTransactionReceipt,
  getBlock: mockGetBlock
}));

// Import after mocks
const { processBuilderOnchainActivity } = await import('../index');

describe('processBuilderOnchainActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save contract logs and transactions', async () => {
    const address = randomWalletAddress();
    const project = await mockScoutProject({
      contractAddresses: [address],
      chainId: 167009
    });

    const contractId = project.contracts[0].id;

    // Mock blockchain responses
    const mockLogs: GetLogsResult = [
      {
        address,
        blockNumber: '100',
        transactionHash: '0xabc',
        transactionIndex: '0',
        logIndex: '0',
        blockHash: '0x456',
        removed: false,
        data: '0x',
        topics: []
      }
    ];

    const mockReceipt: GetTransactionReceiptResult = {
      blockNumber: '100',
      contractAddress: address,
      transactionHash: '0xabc',
      from: '0x789',
      to: address,
      status: '0x1',
      gasUsed: '21000',
      effectiveGasPrice: '1000000000',
      blockHash: '0x456',
      cumulativeGasUsed: '21000',
      logs: [],
      logsBloom: '0x',
      transactionIndex: '0',
      type: '0x0'
    };

    mockGetLogs.mockResolvedValue(mockLogs);
    mockGetTransactionReceipt.mockResolvedValue(mockReceipt);
    mockGetBlock.mockResolvedValue({
      timestamp: 1718275200n
    } as Block);

    // Execute contract interaction retrieval
    await processBuilderOnchainActivity(createContext(), { contractIds: [contractId] });

    // Verify logs were saved
    // const savedLogs = await prisma.scoutProjectContractLog.findMany({
    //   where: {
    //     contractId
    //   }
    // });

    // expect(savedLogs).toHaveLength(1);
    // expect(savedLogs[0]).toMatchObject(
    //   expect.objectContaining({
    //     contractId,
    //     blockNumber: BigInt(100),
    //     txHash: '0xabc',
    //     // from: '0x123',
    //     logIndex: 0
    //   })
    // );

    // Verify transactions were saved
    const savedTransactions = await prisma.scoutProjectContractTransaction.findMany({
      where: {
        contractId
      }
    });

    expect(savedTransactions).toHaveLength(1);
    expect(savedTransactions[0]).toMatchObject({
      contractId,
      blockNumber: BigInt(100),
      txHash: '0xabc',
      from: '0x789',
      to: address,
      status: '0x1',
      gasUsed: BigInt(21000),
      gasPrice: BigInt(1000000000),
      gasCost: BigInt(21000) * BigInt(1000000000)
    });

    // Verify poll event was created
    const pollEvents = await prisma.scoutProjectContractPollEvent.findMany({
      where: {
        contractId
      }
    });

    expect(pollEvents).toHaveLength(1);
    expect(pollEvents[0]).toMatchObject({
      contractId,
      fromBlockNumber: expect.any(BigInt),
      toBlockNumber: expect.any(BigInt),
      processedAt: expect.any(Date),
      processTime: expect.any(Number)
    });
  });

  it('should handle empty logs gracefully', async () => {
    const address = randomWalletAddress();
    const project = await mockScoutProject({
      contractAddresses: [address],
      chainId: 167009
    });
    const contractId = project.contracts[0].id;

    mockGetLogs.mockResolvedValue([]);

    await processBuilderOnchainActivity(createContext(), { contractIds: [contractId] });

    // const savedLogs = await prisma.scoutProjectContractLog.findMany({
    //   where: {
    //     contractId
    //   }
    // });

    // expect(savedLogs).toHaveLength(0);

    const savedTransactions = await prisma.scoutProjectContractTransaction.findMany({
      where: {
        contractId
      }
    });

    expect(savedTransactions).toHaveLength(0);
  });
});
