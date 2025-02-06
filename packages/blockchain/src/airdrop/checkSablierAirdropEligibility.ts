import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { MerkleTree } from 'merkletreejs';
import type { Address } from 'viem';
import { keccak256, encodeAbiParameters, parseAbiParameters } from 'viem';

// @ts-ignore
import sablierMerkleInstantAbi from './SablierMerkleInstant.json' assert { type: 'json' };

const sablierAirdropAbi = sablierMerkleInstantAbi.abi;

type PersistentCampaignDto = {
  total_amount: string;
  number_of_recipients: number;
  merkle_tree: string;
  root: string;
  recipients: {
    address: string;
    amount: string;
  }[];
};

type EligibilityResponse = {
  amount: string;
  index: number;
  proof: Address[];
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
  cid,
  contractAddress,
  chainId
}: {
  contractAddress: Address;
  chainId: number;
  recipientAddress: Address;
  cid: string;
}): Promise<EligibilityResponse> {
  const publicClient = getPublicClient(chainId);
  const hasExpired = await publicClient.readContract({
    address: contractAddress,
    abi: sablierAirdropAbi,
    functionName: 'hasExpired'
  });

  if (hasExpired) {
    throw new Error('Airdrop campaign has expired');
  }

  const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch IPFS data: ${response.statusText}`);
  }

  const campaignData = (await response.json()) as PersistentCampaignDto;

  const recipientIndex = campaignData.recipients.findIndex(
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

  const leaves = campaignData.recipients.map((recipient, index) =>
    hashLeaf(index, recipient.address, recipient.amount)
  );

  const tree = new MerkleTree(leaves, keccak256, {
    sort: true,
    hashLeaves: false
  });

  const leaf = hashLeaf(
    recipientIndex,
    campaignData.recipients[recipientIndex].address,
    campaignData.recipients[recipientIndex].amount
  );

  const proof = tree.getHexProof(leaf) as `0x${string}`[];

  const isValid = tree.verify(proof, leaf, tree.getHexRoot());
  if (!isValid) {
    throw new Error('Failed to verify Merkle proof');
  }

  return {
    amount: campaignData.recipients[recipientIndex].amount,
    index: recipientIndex,
    proof
  };
}
