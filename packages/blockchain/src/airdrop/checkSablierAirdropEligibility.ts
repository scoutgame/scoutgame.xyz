import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import type { Address } from 'viem';

import { getPublicClient } from '../getPublicClient';

import sablierMerkleInstantAbi from './SablierMerkleInstant.json';

const sablierAirdropAbi = sablierMerkleInstantAbi.abi;

export type SablierMerkleTree = {
  root: string;
  total_amount: string;
  merkle_tree: {
    format: string;
    tree: string[];
    values: {
      value: string[];
      tree_index: number;
    }[];
    leaf_encoding: string[];
  };
  number_of_recipients: number;
  recipients: {
    address: string;
    amount: string;
  }[];
};

export async function checkSablierAirdropEligibility({
  recipientAddress,
  contractAddress,
  chainId,
  merkleTreeJson
}: {
  contractAddress: Address;
  chainId: number;
  recipientAddress: Address;
  merkleTreeJson: SablierMerkleTree;
}): Promise<{
  amount: string;
  index: number;
  proof: Address[];
}> {
  const publicClient = getPublicClient(chainId);
  const hasExpired = await publicClient.readContract({
    address: contractAddress,
    abi: sablierAirdropAbi,
    functionName: 'hasExpired'
  });

  if (hasExpired) {
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
    abi: sablierAirdropAbi,
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
    throw new Error('Failed to verify Sablier Merkle proof');
  }

  return {
    amount: merkleTreeJson.recipients[recipientIndex].amount,
    index: recipientIndex,
    proof
  };
}
