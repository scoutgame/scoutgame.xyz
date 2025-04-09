import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import type { Address } from 'viem';

import { getPublicClient } from '../getPublicClient';

import type { FullMerkleTree } from './thirdwebERC20AirdropContract';
import { getThirdwebERC20AirdropExpirationTimestamp } from './thirdwebERC20AirdropContract';

export async function checkThirdwebAirdropEligibility({
  recipientAddress,
  contractAddress,
  chainId,
  merkleTreeJson
}: {
  contractAddress: Address;
  chainId: number;
  recipientAddress: Address;
  merkleTreeJson: FullMerkleTree;
}): Promise<{
  amount: string;
  index: number;
  proof: Address[];
}> {
  const publicClient = getPublicClient(chainId);
  const expirationTimestamp = await getThirdwebERC20AirdropExpirationTimestamp({
    airdropContractAddress: contractAddress,
    chainId
  });

  if (expirationTimestamp < BigInt(Date.now() / 1000)) {
    throw new Error('Airdrop campaign has expired');
  }

  const recipientIndex = merkleTreeJson.recipients.findIndex(
    (r) => r.address.toLowerCase() === recipientAddress.toLowerCase()
  );

  if (recipientIndex === -1) {
    throw new Error('Address is not eligible for this airdrop');
  }

  const hasClaimed = await publicClient.readContract({
    address: contractAddress,
    abi: THIRDWEB_ERC20_AIRDROP_IMPLEMENTATION_ABI,
    functionName: 'hasClaimed',
    args: [BigInt(recipientIndex)]
  });

  if (hasClaimed) {
    throw new Error('Recipient has already claimed this airdrop');
  }

  const tree = StandardMerkleTree.load({
    format: 'standard-v1',
    leafEncoding: ['uint', 'address', 'uint256'],
    tree: merkleTreeJson.merkle_tree.tree,
    values: merkleTreeJson.merkle_tree.values.map((v) => ({
      value: v.value,
      treeIndex: v.tree_index
    }))
  });

  const proof = tree.getProof(recipientIndex) as `0x${string}`[];
  const isValid = tree.verify(recipientIndex, proof);

  if (!isValid) {
    throw new Error('Failed to verify Merkle proof');
  }

  return {
    amount: merkleTreeJson.recipients[recipientIndex].amount,
    proof
  };
}
