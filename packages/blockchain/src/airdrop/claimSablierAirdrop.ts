import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getWalletClient } from '@packages/blockchain/getWalletClient';
import { type Address, type Hash } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { checkSablierAirdropEligibility } from './checkSablierAirdropEligibility';

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

  const amount = BigInt(status.amount);

  try {
    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi: [
        {
          type: 'function',
          name: 'claim',
          inputs: [
            {
              name: 'index',
              type: 'uint256',
              internalType: 'uint256'
            },
            {
              name: 'recipient',
              type: 'address',
              internalType: 'address'
            },
            {
              name: 'amount',
              type: 'uint128',
              internalType: 'uint128'
            },
            {
              name: 'merkleProof',
              type: 'bytes32[]',
              internalType: 'bytes32[]'
            }
          ],
          outputs: [],
          stateMutability: 'payable'
        }
      ],
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
      throw error;
    }
    throw error;
  }
}
