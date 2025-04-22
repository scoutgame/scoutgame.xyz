import { jest } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import type { Address } from 'viem';

const mockPublicClient = {
  readContract: jest.fn()
};

// Mock the external dependencies
jest.unstable_mockModule('@packages/blockchain/getPublicClient', () => ({
  getPublicClient: jest.fn().mockReturnValue(mockPublicClient)
}));

// Mock StandardMerkleTree instead of MerkleTree
jest.unstable_mockModule('@openzeppelin/merkle-tree', () => ({
  StandardMerkleTree: {
    load: jest.fn().mockReturnValue({
      getProof: jest.fn().mockReturnValue(['0xproof1', '0xproof2']),
      verify: jest.fn().mockReturnValue(true)
    })
  }
}));

const { checkSablierAirdropEligibility } = await import('../checkSablierAirdropEligibility');
const { StandardMerkleTree } = await import('@openzeppelin/merkle-tree');

describe('checkSablierAirdropEligibility', () => {
  const mockParams = {
    recipientAddress: '0xRecipientAddress1' as Address,
    contractAddress: '0xContractAddress' as Address,
    chainId: 1,
    merkleTreeJson: {
      root: '0xroot',
      total_amount: '1000',
      merkle_tree: {
        format: 'standard-v1',
        tree: ['0xroot', '0xnode1', '0xnode2'],
        values: [
          {
            value: ['0', '0xRecipientAddress1', '750'],
            tree_index: 0
          },
          {
            value: ['1', '0xRecipientAddress2', '250'],
            tree_index: 1
          }
        ],
        leaf_encoding: ['uint', 'address', 'uint256']
      },
      number_of_recipients: 2,
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
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if airdrop has expired', async () => {
    mockPublicClient.readContract.mockResolvedValueOnce(true as never);
    await expect(checkSablierAirdropEligibility(mockParams)).rejects.toThrow('Airdrop campaign has expired');
  });

  it('should throw error if address is not eligible', async () => {
    mockPublicClient.readContract.mockResolvedValueOnce(false as never); // hasExpired

    await expect(
      checkSablierAirdropEligibility({
        ...mockParams,
        recipientAddress: uuidv4() as Address
      })
    ).rejects.toThrow('Address is not eligible for this airdrop');
  });

  it('should throw error if recipient has already claimed', async () => {
    mockPublicClient.readContract
      .mockResolvedValueOnce(false as never) // hasExpired
      .mockResolvedValueOnce(true as never); // hasClaimed

    await expect(checkSablierAirdropEligibility(mockParams)).rejects.toThrow(
      'Recipient has already claimed this airdrop'
    );
  });

  it('should throw error if merkle proof verification fails', async () => {
    mockPublicClient.readContract
      .mockResolvedValueOnce(false as never) // hasExpired
      .mockResolvedValueOnce(false as never); // hasClaimed

    // Mock StandardMerkleTree verify to return false
    (StandardMerkleTree.load as jest.Mock).mockReturnValueOnce({
      getProof: jest.fn().mockReturnValue(['0xproof1', '0xproof2']),
      verify: jest.fn().mockReturnValue(false)
    });

    await expect(checkSablierAirdropEligibility(mockParams)).rejects.toThrow('Failed to verify Sablier Merkle proof');
  });

  it('should successfully check eligibility for valid recipient', async () => {
    mockPublicClient.readContract
      .mockResolvedValueOnce(false as never) // hasExpired
      .mockResolvedValueOnce(false as never); // hasClaimed

    const result = await checkSablierAirdropEligibility(mockParams);

    expect(result).toEqual({
      amount: '750',
      index: 0,
      proof: ['0xproof1', '0xproof2']
    });
  });
});
