import { generateMerkleTree, getMerkleProofs, verifyMerkleClaim } from '@charmverse/core/protocol';
import type { Address } from 'viem';

import { getPublicClient } from '../getPublicClient';

import type { ThirdwebFullMerkleTree } from './thirdwebERC20AirdropContract';
import { getThirdwebERC20AirdropExpirationTimestamp, getSupplyClaimedByWallet } from './thirdwebERC20AirdropContract';

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

  const supplyClaimedByWallet = await getSupplyClaimedByWallet({
    airdropContractAddress: contractAddress,
    walletAddress: recipientAddress,
    chainId
  });

  if (supplyClaimedByWallet > 0) {
    isClaimed = true;
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
