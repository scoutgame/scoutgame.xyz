import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { createWalletClient, http } from 'viem';
import { type Address, type Hash } from 'viem';

// @ts-ignore
import { checkSablierAirdropEligibility } from './checkSablierAirdropEligibility';
import { abi as sablierAirdropAbi } from './SablierMerkleInstant.json';

export async function claimSablierAirdrop({
  chainId,
  contractAddress,
  recipientAddress,
  cid
}: {
  chainId: number;
  contractAddress: Address;
  recipientAddress: Address;
  cid: string;
}): Promise<{ hash: Hash }> {
  const publicClient = getPublicClient(chainId);
  const walletClient = createWalletClient({
    chain: publicClient.chain,
    transport: http()
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
      abi: sablierAirdropAbi,
      functionName: 'claim',
      args: [BigInt(status.index), recipientAddress, amount, status.proof],
      value: 0n,
      account: recipientAddress
    });

    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });

    return { hash };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('SablierMerkleBase_StreamClaimed')) {
        throw new Error('This airdrop has already been claimed');
      }
      if (error.message.includes('SablierMerkleBase_CampaignExpired')) {
        throw new Error('This airdrop campaign has expired');
      }
      if (error.message.includes('SablierMerkleBase_InvalidProof')) {
        throw new Error('Invalid Merkle proof for this claim');
      }
      if (error.message.includes('SablierMerkleBase_InsufficientFeePayment')) {
        throw new Error('Not enough ETH sent to cover the claim fee');
      }
      if (error.message.includes('SablierMerkleBase_FeeTransferFail')) {
        throw new Error('Failed to transfer claim fee');
      }
      throw error;
    }
    throw error;
  }
}
