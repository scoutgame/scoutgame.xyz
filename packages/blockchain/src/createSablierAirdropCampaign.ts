import { Buffer } from 'buffer';

import FormData from 'form-data';
import { erc20Abi, nonceManager, parseAbi, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { optimism, optimismSepolia, taiko } from 'viem/chains';

import { getPublicClient } from './getPublicClient';
import { getWalletClient } from './getWalletClient';

// Contract ABI
const sablierAirdropFactoryAbi = parseAbi([
  'function createMerkleInstant(tuple(address token, uint40 expiration, address initialAdmin, string ipfsCID, bytes32 merkleRoot, string campaignName, string shape) baseParams, uint256 aggregateAmount, uint256 recipientCount) external returns (address)'
]);

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
  return recipients.reduce((acc, { address, amount }) => {
    acc += `${address},${amount}\n`;
    return acc;
  }, 'address,amount\n');
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

  // Create CSV content and prepare for upload
  const csvContent = createCsvContent(recipients);
  const formData = new FormData();

  // Create a Buffer from the CSV content and append to FormData
  const buffer = Buffer.from(csvContent, 'utf-8');
  formData.append('data', buffer, {
    filename: 'airdrop.csv',
    contentType: 'text/csv'
  });

  // Upload to Merkle API using fetch instead of axios
  const merkleResponse = await fetch(`https://sablier-merkle-api.vercel.app/api/create?decimals=${tokenDecimals}`, {
    method: 'POST',
    body: formData,
    headers: {
      ...Object.fromEntries(formData.getHeaders())
    }
  });

  if (!merkleResponse.ok) {
    throw new Error(`HTTP error! status: ${merkleResponse.status}`);
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

  // Create the Merkle Instant distribution
  const { request } = await publicClient.simulateContract({
    address: sablierAirdropFactoryAddress,
    abi: sablierAirdropFactoryAbi,
    functionName: 'createMerkleInstant',
    args: [baseParams, aggregateAmount, recipientCount],
    account
  });

  const hash = await walletClient.writeContract(request);
  // Wait for transaction receipt
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return receipt;
}
