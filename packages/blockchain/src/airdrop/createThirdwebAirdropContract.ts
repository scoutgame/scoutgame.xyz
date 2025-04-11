import { generateMerkleTree } from '@charmverse/core/protocol';
import { getWalletClient } from '@packages/blockchain/getWalletClient';
import { erc20Abi, type Address } from 'viem';

import { getChainById } from '../chains';

import { deployThirdwebAirdropContract } from './deployThirdwebAirdropContract';

export type Recipient = {
  address: `0x${string}`;
  amount: string;
};

export async function createThirdwebAirdropContract({
  recipients,
  chainId,
  adminPrivateKey,
  tokenAddress,
  expirationTimestamp,
  nullAddressAmount
}: {
  recipients: Recipient[];
  chainId: number;
  adminPrivateKey: `0x${string}`;
  tokenAddress: Address;
  expirationTimestamp: bigint;
  nullAddressAmount?: string;
}) {
  const walletClient = getWalletClient({
    chainId,
    privateKey: adminPrivateKey
  });

  if (!walletClient.account) throw new Error('Wallet not found');

  const normalizedRecipientsRecord: Record<`0x${string}`, bigint> = {};

  for (const recipient of recipients) {
    if (!normalizedRecipientsRecord[recipient.address]) {
      normalizedRecipientsRecord[recipient.address] = BigInt(0);
    }
    normalizedRecipientsRecord[recipient.address] += BigInt(recipient.amount);
  }

  const normalizedRecipients: Recipient[] = Object.entries(normalizedRecipientsRecord).map(([address, amount]) => ({
    address: address as `0x${string}`,
    amount: amount.toString()
  }));

  if (normalizedRecipients.length === 1) {
    if (!nullAddressAmount) {
      throw new Error('There must be atleast 2 recipients, otherwise the merkle tree will not be valid');
    }
    // Add the null address to the recipients to ensure there is atleast 2 recipients, otherwise the merkle tree will not be valid
    normalizedRecipients.push({
      address: '0x0000000000000000000000000000000000000000',
      amount: nullAddressAmount
    });
  }

  const merkleTree = generateMerkleTree(normalizedRecipients);

  const totalAirdropAmount = BigInt(
    normalizedRecipients.reduce((acc, recipient) => acc + BigInt(recipient.amount), BigInt(0))
  );
  const totalRecipients = normalizedRecipients.length;
  const rootHash = `0x${merkleTree.rootHash}`;

  const fullMerkleTree = {
    rootHash,
    recipients: normalizedRecipients,
    layers: merkleTree.tree.getHexLayers(),
    totalAirdropAmount: totalAirdropAmount.toString(),
    totalRecipients
  };

  const { proxyAddress, deployTxHash, blockNumber } = await deployThirdwebAirdropContract({
    chainId,
    adminPrivateKey,
    tokenAddress,
    merkleRoot: rootHash as `0x${string}`,
    totalAirdropAmount,
    // Unix timestamp after which tokens can't be claimed. Should be in seconds.
    expirationTimestamp,
    // Set it to 0 to make it only claimable based off the merkle root
    openClaimLimitPerWallet: BigInt(0)
  });

  const chain = getChainById(chainId);
  if (!chain) throw new Error('Chain not found');

  if (!walletClient.account) throw new Error('Wallet not found');

  await walletClient.writeContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: [proxyAddress, totalAirdropAmount],
    chain: chain.viem,
    account: walletClient.account
  });

  return { airdropContractAddress: proxyAddress, deployTxHash, merkleTree: fullMerkleTree, blockNumber };
}
