import { log } from '@charmverse/core/log';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { Address, Hash } from 'viem';

import { getWalletClient } from '../getWalletClient';

const sablierAirdropAbi = [
  {
    type: 'function',
    name: 'clawback',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint128', internalType: 'uint128' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'TOKEN',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  }
] as const;

const erc20Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

export async function clawbackAirdropTokens({
  chainId,
  contractAddress,
  recipientAddress,
  adminPrivateKey
}: {
  chainId: number;
  contractAddress: Address;
  recipientAddress: Address;
  adminPrivateKey: `0x${string}`;
}): Promise<{ hash: Hash }> {
  const publicClient = getPublicClient(chainId);
  const walletClient = getWalletClient({
    chainId,
    privateKey: adminPrivateKey
  });

  try {
    const tokenAddress = await publicClient.readContract({
      address: contractAddress,
      abi: sablierAirdropAbi,
      functionName: 'TOKEN'
    });

    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [contractAddress]
    });

    if (balance === 0n) {
      throw new Error('No tokens available to clawback');
    }

    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi: sablierAirdropAbi,
      functionName: 'clawback',
      args: [recipientAddress, balance],
      account: walletClient.account
    });

    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });

    return { hash };
  } catch (error) {
    log.error('Clawback failed:', { error, contractAddress, chainId });

    if (error instanceof Error) {
      if (error.message.includes('Errors_NotAdmin')) {
        throw new Error('Not authorized to clawback tokens');
      }
      if (error.message.includes('SablierMerkleBase_ClawbackNotAllowed')) {
        throw new Error('Clawback not allowed at this time');
      }
      if (error.message.includes('User rejected')) {
        throw new Error('Transaction rejected by user');
      }
      throw new Error(error.message);
    }
    throw new Error('Failed to clawback tokens');
  }
}
