import { generateMerkleTree, getMerkleProofs, verifyMerkleClaim } from '@charmverse/core/protocol';
import type { Address } from 'viem';

import { getPublicClient } from '../getPublicClient';

import type { ThirdwebFullMerkleTree } from './thirdwebERC20AirdropContract';
import {
  getThirdwebERC20AirdropExpirationTimestamp,
  THIRDWEB_ERC20_AIRDROP_IMPLEMENTATION_ABI
} from './thirdwebERC20AirdropContract';

const MAX_BLOCK_RANGE = 100000;

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

  if (recipientIndex === -1) {
    return {
      amount: '0',
      index: -1,
      proof: [],
      hasExpired: false,
      isValid: false,
      isClaimed: false
    };
  }

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

  const latestBlock = Number(await publicClient.getBlockNumber());

  const blocksToProcess = Number(latestBlock) - Number(blockNumber) + 1;
  const iterations = Math.max(1, Math.ceil(blocksToProcess / MAX_BLOCK_RANGE));
  let isClaimed = false;

  for (let i = 0; i < iterations; i++) {
    const currentBlock = Number(blockNumber) + i * MAX_BLOCK_RANGE;
    const endBlock = Math.min(currentBlock + MAX_BLOCK_RANGE - 1, latestBlock);
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
      fromBlock: BigInt(currentBlock),
      toBlock: BigInt(endBlock)
    });
    if (events.length > 0) {
      isClaimed = true;
      break;
    }
  }

  return {
    hasExpired: expirationTimestamp < BigInt(Math.floor(Date.now() / 1000)),
    isValid,
    isClaimed,
    amount: merkleTreeJson.recipients[recipientIndex].amount,
    index: recipientIndex,
    proof
  };
}
