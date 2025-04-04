import type { FullMerkleTree } from '@packages/blockchain/airdrop/checkSablierAirdropEligibility';
import { getWalletClient } from '@packages/blockchain/getWalletClient';
import { erc20Abi, type Address } from 'viem';

import { getChainById } from '../chains';

import { deployThirdwebAirdropContract } from './deployThirdwebAirdropContract';

export type Recipient = {
  address: `0x${string}`;
  amount: number;
};

function createCsvContent(recipients: Recipient[]) {
  let csvContent = 'address,amount\n';
  recipients.forEach(({ address, amount }) => {
    csvContent += `${address.toLowerCase()},${amount}\n`;
  });

  return csvContent;
}

export async function createThirdwebAirdropContract({
  recipients,
  chainId,
  adminPrivateKey,
  tokenAddress,
  tokenDecimals,
  proxyFactoryAddress,
  implementationAddress,
  expirationTimestamp
}: {
  recipients: Recipient[];
  chainId: number;
  adminPrivateKey: `0x${string}`;
  tokenAddress: Address;
  tokenDecimals: number;
  proxyFactoryAddress: Address;
  implementationAddress: Address;
  expirationTimestamp: bigint;
}) {
  const walletClient = getWalletClient({
    chainId,
    privateKey: adminPrivateKey
  });

  if (!walletClient.account) throw new Error('Wallet not found');

  // Upload merkle root to ipfs
  const csvContent = createCsvContent(recipients);

  const formData = new FormData();
  const blob = new Blob([csvContent], { type: 'text/csv' });
  formData.append('data', blob, 'airdrop.csv');

  const merkleResponse = await fetch(`https://sablier-merkle-api.vercel.app/api/create?decimals=${tokenDecimals}`, {
    method: 'POST',
    body: formData
  });

  if (!merkleResponse.ok) {
    const errorText = await merkleResponse.text();
    throw new Error(`HTTP error! status: ${merkleResponse.status}, details: ${errorText}`);
  }

  const merkleTree = (await merkleResponse.json()) as { root: `0x${string}`; cid: string; status: string };

  if (!merkleTree.status.toLowerCase().includes('upload successful')) {
    throw new Error(`Merkle tree upload failed: ${merkleTree.status}`);
  }

  const { root: merkleRoot, cid } = merkleTree;

  const fullMerkleTree = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);

  if (!fullMerkleTree.ok) {
    throw new Error(`HTTP error! status: ${fullMerkleTree.status}, details: ${fullMerkleTree.statusText}`);
  }

  const downloadedMerkleTree = (await fullMerkleTree.json()) as Omit<FullMerkleTree, 'merkle_tree'> & {
    merkle_tree: string;
  };

  const fullMerkleTreeJson = {
    ...downloadedMerkleTree,
    merkle_tree: JSON.parse(downloadedMerkleTree.merkle_tree)
  };

  const totalAirdropAmount = BigInt(fullMerkleTreeJson.total_amount);

  const { proxyAddress, deployTxHash } = await deployThirdwebAirdropContract({
    chainId,
    adminPrivateKey,
    tokenAddress,
    merkleRoot,
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

  return { merkleRoot, airdropContractAddress: proxyAddress, deployTxHash, cid, merkleTree: fullMerkleTreeJson };
}
