import { type Address, type Hash } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { getPublicClient } from '../getPublicClient';
import { getWalletClient } from '../getWalletClient';

import { checkSablierAirdropEligibility } from './checkSablierAirdropEligibility';
// @ts-ignore
import { abi as sablierAirdropAbi } from './SablierMerkleInstant.json';

export async function claimSablierAirdrop({
  chainId,
  contractAddress,
  recipientAddress,
  cid,
  adminPrivateKey
}: {
  chainId: number;
  contractAddress: Address;
  recipientAddress: Address;
  cid: string;
  adminPrivateKey: `0x${string}`;
}): Promise<{ hash: Hash }> {
  if (!adminPrivateKey) {
    throw new Error('Admin private key is required');
  }

  const publicClient = getPublicClient(chainId);
  const account = privateKeyToAccount(adminPrivateKey);
  const walletClient = getWalletClient({
    chainId,
    privateKey: adminPrivateKey
  });

  const status = await checkSablierAirdropEligibility({
    chainId,
    contractAddress,
    address: recipientAddress,
    cid
  });

  // Ensure amount fits within uint128
  const amount = BigInt(status.amount!);
  if (amount > BigInt('0xffffffffffffffffffffffffffffffff')) {
    throw new Error('Amount exceeds uint128 maximum value');
  }

  try {
    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi: sablierAirdropAbi,
      functionName: 'claim',
      args: [BigInt(status.index), recipientAddress, amount, status.proof],
      value: 0n,
      account
    });

    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });

    return { hash };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('SablierMerkleBase_StreamClaimed')) {
        throw new Error('This airdrop has already been claimed');
      } else if (error.message.includes('SablierMerkleBase_CampaignExpired')) {
        throw new Error('This airdrop campaign has expired');
      } else if (error.message.includes('SablierMerkleBase_InvalidProof')) {
        throw new Error('Invalid Merkle proof for this claim');
      } else if (error.message.includes('SablierMerkleBase_InsufficientFeePayment')) {
        const match = error.message.match(/feePaid: (\d+), fee: (\d+)/);
        if (match) {
          throw new Error(`Insufficient fee payment. Paid: ${match[1]}, Required: ${match[2]}`);
        }
        throw new Error('Not enough ETH sent to cover the claim fee');
      } else if (error.message.includes('CallerNotAdmin')) {
        throw new Error('Caller is not the admin of this campaign');
      } else if (error.message.includes('SablierMerkleBase_CallerNotFactory')) {
        throw new Error('Caller is not the factory contract');
      } else if (error.message.includes('SablierMerkleBase_FeeTransferFail')) {
        throw new Error('Failed to transfer claim fee');
      }
      // If it's some other error, throw the original
      throw error;
    }
    throw error;
  }
}
