import { generateMerkleTree } from '@charmverse/core/protocol';
import { getWalletClient } from '@packages/blockchain/getWalletClient';
import pinataSdk from '@pinata/sdk';
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
  proxyFactoryAddress,
  implementationAddress,
  expirationTimestamp
}: {
  recipients: Recipient[];
  chainId: number;
  adminPrivateKey: `0x${string}`;
  tokenAddress: Address;
  proxyFactoryAddress: Address;
  implementationAddress: Address;
  expirationTimestamp: bigint;
}) {
  // eslint-disable-next-line new-cap
  const Pinata = new pinataSdk({
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretApiKey: process.env.PINATA_API_SECRET
  });

  const walletClient = getWalletClient({
    chainId,
    privateKey: adminPrivateKey
  });

  if (!walletClient.account) throw new Error('Wallet not found');

  const merkleTree = generateMerkleTree(recipients);

  const totalAirdropAmount = BigInt(recipients.reduce((acc, recipient) => acc + BigInt(recipient.amount), BigInt(0)));
  const totalRecipients = recipients.length;
  const proofMaxQuantityForWallet = BigInt(
    recipients.sort((a, b) => Number(BigInt(b.amount) - BigInt(a.amount)))[0].amount
  );
  const rootHash = `0x${merkleTree.rootHash}`;

  const fullMerkleTree = {
    rootHash,
    recipients,
    layers: merkleTree.tree.getHexLayers(),
    totalAirdropAmount: totalAirdropAmount.toString(),
    totalRecipients,
    proofMaxQuantityForWallet: proofMaxQuantityForWallet.toString()
  };

  const response = await Pinata.pinJSONToIPFS(fullMerkleTree);

  const cid = response.IpfsHash;

  const { proxyAddress, deployTxHash, blockNumber } = await deployThirdwebAirdropContract({
    chainId,
    adminPrivateKey,
    tokenAddress,
    merkleRoot: rootHash as `0x${string}`,
    totalAirdropAmount,
    // Unix timestamp after which tokens can't be claimed. Should be in seconds.
    expirationTimestamp,
    // Set it to 0 to make it only claimable based off the merkle root
    openClaimLimitPerWallet: BigInt(0),
    trustedForwarders: [],
    proxyFactoryAddress,
    implementationAddress
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

  return { airdropContractAddress: proxyAddress, deployTxHash, cid, merkleTree: fullMerkleTree, blockNumber };
}
