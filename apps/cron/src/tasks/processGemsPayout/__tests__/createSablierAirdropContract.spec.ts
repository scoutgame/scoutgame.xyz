import { jest } from '@jest/globals';
import { optimism } from 'viem/chains';

const mockWalletClient = {
  writeContract: jest.fn(),
  simulateContract: jest.fn(),
  waitForTransactionReceipt: jest.fn()
};

jest.unstable_mockModule('@packages/blockchain/getWalletClient', () => ({
  getWalletClient: jest.fn().mockReturnValue(mockWalletClient)
}));

jest.unstable_mockModule('viem/accounts', () => ({
  privateKeyToAccount: jest.fn().mockReturnValue({
    address: '0xTestAddress'
  })
}));

const { createSablierAirdropContract } = await import('../createSablierAirdropContract');

describe('createSablierAirdropContract', () => {
  const mockParams = {
    adminPrivateKey: '0xTestPrivateKey' as `0x${string}`,
    tokenAddress: '0xTokenAddress' as `0x${string}`,
    chainId: optimism.id,
    recipients: [
      { address: '0xRecipient1' as `0x${string}`, amount: 100 },
      { address: '0xRecipient2' as `0x${string}`, amount: 200 }
    ],
    campaignName: 'Test Campaign',
    tokenDecimals: 18,
    nullAddressAmount: 0.001
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore
    global.fetch = jest.fn();
    // @ts-ignore
    global.FormData = jest.fn().mockImplementation(() => ({
      append: jest.fn()
    }));
    global.File = jest.fn() as any;
  });

  it('should successfully create a Sablier airdrop contract', async () => {
    // Mock successful API response with status field
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          root: '0xMerkleRoot',
          cid: 'testCID',
          status: 'upload successful'
        })
    } as never);

    mockWalletClient.simulateContract
      .mockResolvedValueOnce({ request: 'createRequest' } as never)
      .mockResolvedValueOnce({ request: 'transferRequest' } as never);

    mockWalletClient.writeContract.mockResolvedValueOnce('0xTransactionHash' as never);

    mockWalletClient.waitForTransactionReceipt.mockResolvedValueOnce({
      logs: [{ address: '0xCreatedContractAddress' }]
    } as never);

    const { hash, root, cid, contractAddress } = await createSablierAirdropContract(mockParams);

    expect(hash).toEqual('0xTransactionHash');
    expect(root).toEqual('0xMerkleRoot');
    expect(cid).toEqual('testCID');
    expect(contractAddress).toEqual('0xCreatedContractAddress'.toLowerCase());
  });

  it('should handle API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Bad Request')
    } as never);

    await expect(createSablierAirdropContract(mockParams)).rejects.toThrow(
      'HTTP error! status: 400, details: Bad Request'
    );
  });

  it('should handle contract simulation failures', async () => {
    // Mock successful API response with status field
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          root: '0xMerkleRoot',
          cid: 'testCID',
          status: 'upload successful'
        })
    } as never);

    mockWalletClient.simulateContract.mockRejectedValueOnce(new Error('Contract simulation failed') as never);

    await expect(createSablierAirdropContract(mockParams)).rejects.toThrow('Contract simulation failed');
  });

  it('should correctly normalize recipient amounts', async () => {
    // Mock successful API response with status field
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          root: '0xMerkleRoot',
          cid: 'testCID',
          status: 'upload successful'
        })
    } as never);

    const duplicateRecipients = {
      ...mockParams,
      recipients: [
        { address: '0xRecipient1' as `0x${string}`, amount: 100 },
        { address: '0xRecipient1' as `0x${string}`, amount: 100 },
        { address: '0xRecipient2' as `0x${string}`, amount: 200 }
      ]
    };

    mockWalletClient.simulateContract
      .mockResolvedValueOnce({ request: 'createRequest' } as never)
      .mockResolvedValueOnce({ request: 'transferRequest' } as never);

    mockWalletClient.writeContract.mockResolvedValueOnce('0xTransactionHash' as never);

    mockWalletClient.waitForTransactionReceipt.mockResolvedValueOnce({
      logs: [{ address: '0xCreatedContractAddress' }]
    } as never);

    await createSablierAirdropContract(duplicateRecipients);

    // Updated assertion to match the actual CSV format
    expect(global.File).toHaveBeenCalledWith(['address,amount\n0xrecipient1,200\n0xrecipient2,200\n'], 'airdrop.csv', {
      type: 'text/csv'
    });
  });
});
