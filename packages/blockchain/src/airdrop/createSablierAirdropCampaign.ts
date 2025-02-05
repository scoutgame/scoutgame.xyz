import { erc20Abi, nonceManager, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { optimism, optimismSepolia, taiko } from 'viem/chains';

import { getPublicClient } from '../getPublicClient';
import { getWalletClient } from '../getWalletClient';

// Contract ABI
const sablierAirdropFactoryAbi = [
  {
    type: 'function',
    name: 'createMerkleInstant',
    inputs: [
      {
        name: 'baseParams',
        type: 'tuple',
        components: [
          { name: 'token', type: 'address' },
          { name: 'expiration', type: 'uint40' },
          { name: 'initialAdmin', type: 'address' },
          { name: 'ipfsCID', type: 'string' },
          { name: 'merkleRoot', type: 'bytes32' },
          { name: 'campaignName', type: 'string' },
          { name: 'shape', type: 'string' }
        ]
      },
      { name: 'aggregateAmount', type: 'uint256' },
      { name: 'recipientCount', type: 'uint256' }
    ],
    outputs: [{ type: 'address' }],
    stateMutability: 'external'
  }
] as const;

const SablierAirdropFactoryContractRecords: Record<number, `0x${string}`> = {
  [optimismSepolia.id]: '0x2934A7aDDC3000D1625eD1E8D21C070a89073702',
  [taiko.id]: '0x39D4D8C60D3596B75bc09863605BBB4dcE8243F1',
  [optimism.id]: '0x2455bff7a71E6e441b2d0B1b1e480fe36EbF6D1E'
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

export async function createSablierAirdropCampaign({
  adminPrivateKey,
  tokenAddress,
  chainId,
  recipients,
  campaignName,
  tokenDecimals
}: {
  chainId: number;
  adminPrivateKey: `0x${string}`;
  tokenAddress: `0x${string}`;
  tokenDecimals: number;
  recipients: Recipient[];
  campaignName: string;
}) {
  const publicClient = getPublicClient(chainId);

  const account = privateKeyToAccount(adminPrivateKey, {
    nonceManager
  });

  const walletClient = getWalletClient({
    chainId,
    privateKey: adminPrivateKey
  });

  const csvContent = createCsvContent(recipients);

  const file = new File([csvContent], 'airdrop.csv', {
    type: 'text/csv'
  });

  const formData = new FormData();
  formData.append('data', file);

  const merkleResponse = await fetch(`https://sablier-merkle-api.vercel.app/api/create?decimals=${tokenDecimals}`, {
    method: 'POST',
    body: formData
  });

  if (!merkleResponse.ok) {
    const errorText = await merkleResponse.text();
    throw new Error(`HTTP error! status: ${merkleResponse.status}, details: ${errorText}`);
  }

  const merkleData = (await merkleResponse.json()) as { root: `0x${string}`; cid: string };
  const { root, cid } = merkleData;

  const baseParams = {
    token: tokenAddress,
    expiration: BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60), // 30 days
    initialAdmin: account.address,
    ipfsCID: cid,
    merkleRoot: root as `0x${string}`,
    campaignName,
    shape: ''
  };

  const aggregateAmount = parseUnits(recipients.reduce((acc, { amount }) => acc + amount, 0).toString(), 18);
  const recipientCount = recipients.length;

  const sablierAirdropFactoryAddress = SablierAirdropFactoryContractRecords[chainId];

  if (!sablierAirdropFactoryAddress) {
    throw new Error(`Sablier airdrop factory address not found for chainId ${chainId}`);
  }

  // Approve tokens first
  const { request: approveRequest } = await publicClient.simulateContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: [sablierAirdropFactoryAddress, aggregateAmount],
    account
  });

  await walletClient.writeContract(approveRequest);

  const { request } = await publicClient.simulateContract({
    address: sablierAirdropFactoryAddress,
    abi: sablierAirdropFactoryAbi,
    functionName: 'createMerkleInstant',
    args: [baseParams, aggregateAmount, recipientCount],
    account
  });

  const hash = await walletClient.writeContract(request);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // Get the created campaign address from the logs
  const createdCampaignAddress = receipt.logs[0].address as `0x${string}`;

  // Approve the campaign contract to spend tokens
  const { request: approveCampaignRequest } = await publicClient.simulateContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: [createdCampaignAddress, aggregateAmount],
    account
  });

  await walletClient.writeContract(approveCampaignRequest);

  return {
    receipt,
    hash,
    root,
    cid,
    contractAddress: createdCampaignAddress
  };
}
