import { MerkleTree } from 'merkletreejs';
import type { Address } from 'viem';
import { keccak256, encodeAbiParameters, parseAbiParameters } from 'viem';

import { getPublicClient } from '../getPublicClient';

import sablierMerkleInstantAbi from './SablierMerkleInstant.json';

const sablierAirdropAbi = sablierMerkleInstantAbi.abi;

export type MerkleTreeDto = {
  root: string;
  recipients: {
    address: string;
    amount: string;
  }[];
};

// Update the eligibility check to use the same hashing function as the contract
function hashLeaf(index: number, address: string, amount: string): Address {
  const encoded = encodeAbiParameters(parseAbiParameters('uint256, address, uint256'), [
    BigInt(index),
    address as Address,
    BigInt(amount)
  ]);
  const firstHash = keccak256(encoded);
  return keccak256(firstHash);
}

export async function checkSablierAirdropEligibility({
  recipientAddress,
  contractAddress,
  chainId,
  merkleTree
}: {
  contractAddress: Address;
  chainId: number;
  recipientAddress: Address;
  merkleTree: MerkleTreeDto;
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

  const recipientIndex = merkleTree.recipients.findIndex(
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

  const leaves = merkleTree.recipients.map((recipient, index) => hashLeaf(index, recipient.address, recipient.amount));

  const tree = new MerkleTree(leaves, keccak256, {
    sort: true,
    hashLeaves: false
  });

  const leaf = hashLeaf(
    recipientIndex,
    merkleTree.recipients[recipientIndex].address,
    merkleTree.recipients[recipientIndex].amount
  );

  const proof = tree.getHexProof(leaf) as `0x${string}`[];

  const isValid = tree.verify(proof, leaf, merkleTree.root);
  if (!isValid) {
    throw new Error('Failed to verify Merkle proof');
  }

  return {
    amount: merkleTree.recipients[recipientIndex].amount,
    index: recipientIndex,
    proof
  };
}
