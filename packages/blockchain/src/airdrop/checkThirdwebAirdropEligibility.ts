import { generateMerkleTree, getMerkleProofs, verifyMerkleClaim } from '@charmverse/core/protocol';
import type { Address } from 'viem';

import { getPublicClient } from '../getPublicClient';

import type { ThirdwebFullMerkleTree } from './thirdwebERC20AirdropContract';
import {
  getThirdwebERC20AirdropExpirationTimestamp,
  THIRDWEB_ERC20_AIRDROP_IMPLEMENTATION_ABI
} from './thirdwebERC20AirdropContract';

export async function checkThirdwebAirdropEligibility({
  recipientAddress,
  contractAddress,
  chainId,
  merkleTreeJson,
  blockNumber
}: {
  blockNumber: bigint;
  contractAddress: Address;
  chainId: number;
  recipientAddress: Address;
  merkleTreeJson: ThirdwebFullMerkleTree;
}): Promise<{
  amount: string;
  index: number;
  proof: Address[];
  hasExpired: boolean;
  isValid: boolean;
  isClaimed: boolean;
}> {
  const publicClient = getPublicClient(chainId);
  const expirationTimestamp = await getThirdwebERC20AirdropExpirationTimestamp({
    airdropContractAddress: contractAddress,
    chainId
  });

  const recipientIndex = merkleTreeJson.recipients.findIndex(
    (r) => r.address.toLowerCase() === recipientAddress.toLowerCase()
  );

  const tree = generateMerkleTree(merkleTreeJson.recipients);
  const proof = getMerkleProofs(tree.tree, {
    address: recipientAddress,
    amount: merkleTreeJson.recipients[recipientIndex].amount
  });

  const isValid = verifyMerkleClaim(
    tree.tree,
    {
      address: recipientAddress,
      amount: merkleTreeJson.recipients[recipientIndex].amount
    },
    proof
  );

  const events = await publicClient.getLogs({
    address: contractAddress,
    event: {
      type: 'event',
      name: 'TokensClaimed',
      inputs: [
        { type: 'address', name: 'claimer', indexed: true },
        { type: 'address', name: 'receiver', indexed: true },
        { type: 'uint256', name: 'quantityClaimed', indexed: false }
      ]
    },
    args: {
      receiver: recipientAddress
    },
    fromBlock: blockNumber
  });

  const isClaimed = events.length > 0;

  return {
    hasExpired: expirationTimestamp < BigInt(Math.floor(Date.now() / 1000)),
    isValid,
    isClaimed,
    amount: merkleTreeJson.recipients[recipientIndex].amount,
    index: recipientIndex,
    proof
  };
}
