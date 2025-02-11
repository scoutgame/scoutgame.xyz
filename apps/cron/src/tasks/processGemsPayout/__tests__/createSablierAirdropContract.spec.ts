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

  const mockMerkleTreeJson = {
    root: '0xMerkleRoot',
    total_amount: '300',
    merkle_tree: JSON.stringify({
      format: 'standard-v1',
      tree: ['0xroot'],
      values: [],
      leaf_encoding: ['uint', 'address', 'uint256']
    }),
    number_of_recipients: 2,
    recipients: mockParams.recipients
  };

  let mockFormDataAppend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormDataAppend = jest.fn();
    // @ts-ignore
    global.fetch = jest.fn();
    // @ts-ignore
    global.FormData = jest.fn().mockImplementation(() => ({
      append: mockFormDataAppend
    }));
  });

  it('should handle Sablier API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Bad Request')
    } as never);

    await expect(createSablierAirdropContract(mockParams)).rejects.toThrow(
      'HTTP error! status: 400, details: Bad Request'
    );
  });

  it('should handle Pinata IPFS fetch errors', async () => {
    // Mock successful Sablier API response but failed Pinata response
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            root: '0xMerkleRoot',
            cid: 'testCID',
            status: 'upload successful'
          })
      } as never)
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity'
      } as never);

    await expect(createSablierAirdropContract(mockParams)).rejects.toThrow(
      'HTTP error! status: 422, details: Unprocessable Entity'
    );
  });

  it('should handle contract simulation failures', async () => {
    // Mock both API calls
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            root: '0xMerkleRoot',
            cid: 'testCID',
            status: 'upload successful'
          })
      } as never)
      // Add mock for Pinata gateway call
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMerkleTreeJson)
      } as never);

    mockWalletClient.simulateContract.mockRejectedValueOnce(new Error('Contract simulation failed') as never);

    await expect(createSablierAirdropContract(mockParams)).rejects.toThrow('Contract simulation failed');
  });

  it('should successfully create a Sablier airdrop contract', async () => {
    // Mock successful Sablier API response
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            root: '0xMerkleRoot',
            cid: 'testCID',
            status: 'upload successful'
          })
      } as never)
      // Mock successful Pinata IPFS response
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMerkleTreeJson)
      } as never);

    mockWalletClient.simulateContract
      .mockResolvedValueOnce({ request: 'createRequest' } as never)
      .mockResolvedValueOnce({ request: 'transferRequest' } as never);

    mockWalletClient.writeContract.mockResolvedValueOnce('0xTransactionHash' as never);

    mockWalletClient.waitForTransactionReceipt.mockResolvedValueOnce({
      logs: [{ address: '0xCreatedContractAddress' }]
    } as never);

    const result = await createSablierAirdropContract(mockParams);

    expect(result.hash).toEqual('0xTransactionHash');
    expect(result.root).toEqual('0xMerkleRoot');
    expect(result.cid).toEqual('testCID');
    expect(result.contractAddress).toEqual('0xCreatedContractAddress'.toLowerCase());
    expect(global.fetch).toHaveBeenNthCalledWith(2, 'https://gateway.pinata.cloud/ipfs/testCID');
  });

  it('should correctly normalize recipient amounts', async () => {
    // Mock successful API response with status field
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            root: '0xMerkleRoot',
            cid: 'testCID',
            status: 'upload successful'
          })
      } as never)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMerkleTreeJson)
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

    // Verify FormData was called with correct CSV content
    expect(mockFormDataAppend).toHaveBeenCalledWith('data', expect.any(Blob), 'airdrop.csv');

    // Get the Blob content directly using text()
    const blobContent = mockFormDataAppend.mock.calls[0][1];
    const blobText = await (blobContent as Blob).text();

    expect(blobText).toBe('address,amount\n0xrecipient1,200\n0xrecipient2,200\n');
  });
});
