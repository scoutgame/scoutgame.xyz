import { log } from '@charmverse/core/log';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { erc20Abi, type Address, type Hash } from 'viem';

import { getWalletClient } from '../getWalletClient';

import sablierMerkleInstantAbi from './SablierMerkleInstant.json';

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
}): Promise<{ hash: Hash; balance: bigint }> {
  const publicClient = getPublicClient(chainId);
  const walletClient = getWalletClient({
    chainId,
    privateKey: adminPrivateKey
  });

  try {
    const tokenAddress = await publicClient.readContract({
      address: contractAddress,
      abi: sablierMerkleInstantAbi.abi,
      functionName: 'TOKEN'
    });

    const balance = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [contractAddress]
    });

    if (balance === 0n) {
      throw new Error('No tokens available to clawback');
    }

    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi: sablierMerkleInstantAbi.abi,
      functionName: 'clawback',
      args: [recipientAddress, balance],
      account: walletClient.account
    });

    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });
    log.info('Clawback successful:', { hash, contractAddress, chainId, recipientAddress, balance });
    return { hash, balance };
  } catch (error) {
    log.error('Clawback failed:', { error, contractAddress, chainId });

    if (error instanceof Error) {
      if (error.message.includes('CallerNotAdmin')) {
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
