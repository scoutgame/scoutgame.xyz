import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { createPublicClient } from 'viem';
import type { Log, TransactionReceipt } from 'viem';

// Mock viem
jest.mock('viem', () => ({
  createPublicClient: jest.fn(),
  http: jest.fn()
}));

const mockGetLogs = jest.fn();
const mockGetTransactionReceipt = jest.fn();

(createPublicClient as jest.Mock).mockReturnValue({
  getLogs: mockGetLogs,
  getTransactionReceipt: mockGetTransactionReceipt
});

// Import after mocks
const { retrieveContractInteractions } = await import('../index');

describe('retrieveContractInteractions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save contract logs and transactions', async () => {
    // Create a test contract
    const contract = await prisma.scoutProjectContract.create({
      data: {
        address: '0x123',
        chainId: 167004, // Taiko chain ID
        project: {
          create: {
            name: 'Test Project',
            avatar: 'test.png',
            description: 'Test Description'
          }
        }
      }
    });

    // Mock blockchain responses
    const mockLogs: Log[] = [
      {
        address: '0x123',
        blockNumber: 100n,
        transactionHash: '0xabc',
        logIndex: 0,
        blockHash: '0x456',
        removed: false,
        data: '0x',
        topics: []
      }
    ];

    const mockReceipt: TransactionReceipt = {
      blockNumber: 100n,
      transactionHash: '0xabc',
      from: '0x789',
      to: '0x123',
      status: 'success',
      gasUsed: 21000n,
      effectiveGasPrice: 1000000000n,
      blockHash: '0x456',
      cumulativeGasUsed: 21000n,
      logs: [],
      logsBloom: '0x',
      transactionIndex: 0,
      type: 'eip1559'
    };

    mockGetLogs.mockResolvedValue(mockLogs);
    mockGetTransactionReceipt.mockResolvedValue(mockReceipt);

    // Execute contract interaction retrieval
    await retrieveContractInteractions({});

    // Verify logs were saved
    const savedLogs = await prisma.scoutProjectContractLog.findMany({
      where: {
        contractId: contract.id
      }
    });

    expect(savedLogs).toHaveLength(1);
    expect(savedLogs[0]).toMatchObject({
      contractId: contract.id,
      blockNumber: 100,
      txHash: '0xabc',
      from: '0x123',
      logIndex: 0
    });

    // Verify transactions were saved
    const savedTransactions = await prisma.scoutProjectContractTransaction.findMany({
      where: {
        contractId: contract.id
      }
    });

    expect(savedTransactions).toHaveLength(1);
    expect(savedTransactions[0]).toMatchObject({
      contractId: contract.id,
      blockNumber: 100,
      txHash: '0xabc',
      from: '0x789',
      to: '0x123',
      status: 'success',
      gasUsed: 21000,
      gasPrice: 1000000000,
      gasCost: 21000n * 1000000000n
    });

    // Verify poll event was created
    const pollEvents = await prisma.scoutProjectContractPollEvent.findMany({
      where: {
        contractId: contract.id
      }
    });

    expect(pollEvents).toHaveLength(1);
    expect(pollEvents[0]).toMatchObject({
      contractId: contract.id,
      fromBlockNumber: expect.any(BigInt),
      toBlockNumber: expect.any(BigInt),
      processedAt: expect.any(Date),
      processTime: expect.any(Number)
    });
  });

  it('should handle empty logs gracefully', async () => {
    const contract = await prisma.scoutProjectContract.create({
      data: {
        address: '0x123',
        chainId: 167004,
        project: {
          create: {
            name: 'Test Project',
            avatar: 'test.png',
            description: 'Test Description'
          }
        }
      }
    });

    mockGetLogs.mockResolvedValue([]);

    await retrieveContractInteractions({});

    const savedLogs = await prisma.scoutProjectContractLog.findMany({
      where: {
        contractId: contract.id
      }
    });

    expect(savedLogs).toHaveLength(0);

    const savedTransactions = await prisma.scoutProjectContractTransaction.findMany({
      where: {
        contractId: contract.id
      }
    });

    expect(savedTransactions).toHaveLength(0);
  });

  it('should continue processing other contracts if one fails', async () => {
    // Create two test contracts
    const [contract1, contract2] = await Promise.all([
      prisma.scoutProjectContract.create({
        data: {
          createdBy: 'test',
          deployedAt: new Date(),
          deployTxHash: '0xabc',
          blockNumber: 100n,
          deployer: '0x789',
          address: '0x123',
          chainId: 167004,
          project: {
            create: {
              name: 'Test Project 1',
              avatar: 'test1.png',
              description: 'Test Description 1'
            }
          }
        }
      }),
      prisma.scoutProjectContract.create({
        data: {
          createdBy: 'test',
          deployedAt: new Date(),
          deployTxHash: '0xdef',
          blockNumber: 100n,
          deployer: '0x789',
          address: '0x456',
          chainId: 167004,
          project: {
            create: {
              name: 'Test Project 2',
              avatar: 'test2.png',
              description: 'Test Description 2'
            }
          }
        }
      })
    ]);

    // Make first contract fail
    mockGetLogs.mockRejectedValueOnce(new Error('Network error'));

    // Make second contract succeed
    const mockLogs: Log[] = [
      {
        address: '0x456',
        blockNumber: 100n,
        transactionHash: '0xdef',
        logIndex: 0,
        blockHash: '0x789',
        removed: false,
        data: '0x',
        topics: [],
        transactionIndex: 0
      }
    ];

    mockGetLogs.mockResolvedValueOnce(mockLogs);
    mockGetTransactionReceipt.mockResolvedValueOnce({
      blockNumber: 100n,
      transactionHash: '0xdef',
      from: '0x789',
      to: '0x456',
      status: 'success',
      gasUsed: 21000n,
      effectiveGasPrice: 1000000000n,
      blockHash: '0x789',
      cumulativeGasUsed: 21000n,
      logs: [],
      logsBloom: '0x',
      transactionIndex: 0,
      type: 'eip1559',
      contractAddress: '0x456'
    });

    await retrieveContractInteractions({});

    // Verify second contract was processed despite first contract's failure
    const savedLogs = await prisma.scoutProjectContractLog.findMany({
      where: {
        contractId: contract2.id
      }
    });

    expect(savedLogs).toHaveLength(1);
  });
});
