import { jest } from '@jest/globals';
import type { Address } from 'viem';

const mockPublicClient = {
  readContract: jest.fn()
};

// Mock the external dependencies
jest.unstable_mockModule('@packages/blockchain/getPublicClient', () => ({
  getPublicClient: jest.fn().mockReturnValue(mockPublicClient)
}));

// Mock MerkleTree
jest.unstable_mockModule('merkletreejs', () => ({
  MerkleTree: jest.fn().mockImplementation(() => ({
    getHexProof: jest.fn().mockReturnValue(['0xproof1', '0xproof2']),
    verify: jest.fn().mockReturnValue(true),
    getHexRoot: jest.fn().mockReturnValue('0xroot')
  }))
}));

jest.unstable_mockModule('viem', () => ({
  keccak256: jest.fn().mockReturnValue('0xhash'),
  encodeAbiParameters: jest.fn().mockReturnValue('0xencoded'),
  parseAbiParameters: jest.fn().mockReturnValue('0xparsed')
}));

const { checkSablierAirdropEligibility } = await import('../checkSablierAirdropEligibility');
const { getPublicClient } = await import('@packages/blockchain/getPublicClient');
const { MerkleTree } = await import('merkletreejs');
const { keccak256, encodeAbiParameters, parseAbiParameters } = await import('viem');

describe('checkSablierAirdropEligibility', () => {
  const mockParams = {
    recipientAddress: '0xRecipientAddress1' as Address,
    cid: 'testCID',
    contractAddress: '0xContractAddress' as Address,
    chainId: 1
  };

  const mockCampaignData = {
    total_amount: '1000',
    number_of_recipients: 2,
    merkle_tree: 'tree',
    root: '0xroot',
    recipients: [
      {
        address: '0xRecipientAddress1',
        amount: '750'
      },
      {
        address: '0xRecipientAddress2',
        amount: '250'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn();
  });

  it('should throw error if airdrop has expired', async () => {
    mockPublicClient.readContract.mockResolvedValueOnce(true as never);
    await expect(checkSablierAirdropEligibility(mockParams)).rejects.toThrow('Airdrop campaign has expired');
  });

  it('should throw error if address is not eligible', async () => {
    mockPublicClient.readContract.mockResolvedValueOnce(false as never); // hasExpired

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          ...mockCampaignData,
          recipients: [
            {
              address: '0xDifferentAddress',
              amount: '1000'
            }
          ]
        })
    } as never);

    await expect(checkSablierAirdropEligibility(mockParams)).rejects.toThrow(
      'Address is not eligible for this airdrop'
    );
  });

  it('should throw error if IPFS fetch fails', async () => {
    mockPublicClient.readContract.mockResolvedValueOnce(false as never); // hasExpired

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found'
    } as never);

    await expect(checkSablierAirdropEligibility(mockParams)).rejects.toThrow('Failed to fetch IPFS data: Not Found');
  });

  it('should throw error if recipient has already claimed', async () => {
    mockPublicClient.readContract
      .mockResolvedValueOnce(false as never) // hasExpired
      .mockResolvedValueOnce(true as never); // hasClaimed

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCampaignData)
    } as never);

    await expect(checkSablierAirdropEligibility(mockParams)).rejects.toThrow(
      'Recipient has already claimed this airdrop'
    );
  });

  it('should throw error if merkle proof verification fails', async () => {
    mockPublicClient.readContract
      .mockResolvedValueOnce(false as never) // hasExpired
      .mockResolvedValueOnce(false as never); // hasClaimed

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCampaignData)
    } as never);

    // Mock MerkleTree verify to return false
    (MerkleTree as unknown as jest.Mock).mockImplementationOnce(() => ({
      getHexProof: jest.fn().mockReturnValue(['0xproof1', '0xproof2']),
      verify: jest.fn().mockReturnValue(false),
      getHexRoot: jest.fn().mockReturnValue('0xroot')
    }));

    await expect(checkSablierAirdropEligibility(mockParams)).rejects.toThrow('Failed to verify Merkle proof');
  });

  it('should successfully check eligibility for valid recipient', async () => {
    // Mock contract calls
    mockPublicClient.readContract
      .mockResolvedValueOnce(false as never) // hasExpired
      .mockResolvedValueOnce(false as never); // hasClaimed

    // Mock IPFS fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCampaignData)
    } as never);

    const result = await checkSablierAirdropEligibility(mockParams);

    expect(result).toEqual({
      amount: '750',
      index: 0,
      proof: ['0xproof1', '0xproof2']
    });
  });
});
