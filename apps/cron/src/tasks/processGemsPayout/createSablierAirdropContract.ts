import type { FullMerkleTree } from '@packages/blockchain/airdrop/checkSablierAirdropEligibility';
import { getWalletClient } from '@packages/blockchain/getWalletClient';
import { erc20Abi, nonceManager, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, optimism, optimismSepolia, taiko } from 'viem/chains';

import SablierAirdropFactoryAbi from './SablierMerkleFactory.json';

// Merkle Airdrops Deployment Addresses: https://docs.sablier.com/guides/airdrops/deployments
const SablierAirdropFactoryContractRecords: Record<number, `0x${string}`> = {
  [optimismSepolia.id]: '0x2934A7aDDC3000D1625eD1E8D21C070a89073702',
  [taiko.id]: '0x39D4D8C60D3596B75bc09863605BBB4dcE8243F1',
  [optimism.id]: '0x2455bff7a71E6e441b2d0B1b1e480fe36EbF6D1E',
  [base.id]: '0xD9e108f26fe104CE1058D48070438deDB3aD826A'
};

type Recipient = {
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

export async function createSablierAirdropContract({
  adminPrivateKey,
  tokenAddress,
  chainId,
  recipients,
  campaignName,
  tokenDecimals,
  nullAddressAmount
}: {
  chainId: number;
  adminPrivateKey: `0x${string}`;
  tokenAddress: `0x${string}`;
  tokenDecimals: number;
  recipients: Recipient[];
  campaignName: string;
  nullAddressAmount: number;
}) {
  const account = privateKeyToAccount(adminPrivateKey, {
    nonceManager
  });

  const walletClient = getWalletClient({
    chainId,
    privateKey: adminPrivateKey
  });

  const sablierAirdropFactoryAddress = SablierAirdropFactoryContractRecords[chainId];

  if (!sablierAirdropFactoryAddress) {
    throw new Error(`Sablier airdrop factory address not found for chainId ${chainId}`);
  }

  const normalizedRecipientsRecord: Record<`0x${string}`, number> = {};

  for (const recipient of recipients) {
    if (!normalizedRecipientsRecord[recipient.address]) {
      normalizedRecipientsRecord[recipient.address] = 0;
    }
    normalizedRecipientsRecord[recipient.address] += recipient.amount;
  }

  const normalizedRecipients = Object.entries(normalizedRecipientsRecord).map(([address, amount]) => ({
    address: address as `0x${string}`,
    amount
  }));

  if (normalizedRecipients.length === 1) {
    // Add the null address to the recipients to ensure there is atleast 2 recipients, otherwise the merkle tree will not be valid
    normalizedRecipients.push({ address: '0x0000000000000000000000000000000000000000', amount: nullAddressAmount });
  }

  const csvContent = createCsvContent(normalizedRecipients);

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

  const { root, cid } = merkleTree;

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

  const baseParams = {
    token: tokenAddress,
    expiration: BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60),
    initialAdmin: account.address,
    cid,
    merkleRoot: root as `0x${string}`,
    campaignName,
    shape: ''
  };

  const aggregateAmount = parseUnits(recipients.reduce((acc, { amount }) => acc + amount, 0).toString(), tokenDecimals);
  const recipientCount = recipients.length;

  const { request } = await walletClient.simulateContract({
    address: sablierAirdropFactoryAddress,
    abi: SablierAirdropFactoryAbi.abi,
    functionName: 'createMerkleInstant',
    args: [baseParams, aggregateAmount, recipientCount],
    account
  });

  const hash = await walletClient.writeContract(request);

  const receipt = await walletClient.waitForTransactionReceipt({ hash });

  const createdContractAddress = receipt.logs[0].address as `0x${string}`;

  const { request: transferRequest } = await walletClient.simulateContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'transfer',
    args: [createdContractAddress, aggregateAmount],
    account
  });

  await walletClient.writeContract(transferRequest);

  return {
    receipt,
    hash,
    root,
    cid,
    merkleTree: fullMerkleTreeJson,
    contractAddress: createdContractAddress.toLowerCase()
  };
}
