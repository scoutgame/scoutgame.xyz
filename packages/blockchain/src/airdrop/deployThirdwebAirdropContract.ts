import { log } from '@charmverse/core/log';
import type { Address, Hex } from 'viem';
import { encodeFunctionData } from 'viem';

import { getPublicClient } from '../getPublicClient';
import { getWalletClient } from '../getWalletClient';

import {
  THIRDWEB_ERC20_AIRDROP_IMPLEMENTATION_ABI,
  THIRDWEB_ERC20_AIRDROP_PROXY_ABI
} from './thirdwebERC20AirdropContract';

export async function deployThirdwebAirdropContract({
  tokenAddress,
  merkleRoot,
  totalAirdropAmount,
  expirationTimestamp,
  openClaimLimitPerWallet,
  trustedForwarders,
  proxyFactoryAddress,
  implementationAddress,
  chainId,
  adminPrivateKey
}: {
  chainId: number;
  proxyFactoryAddress: Address;
  implementationAddress: Address;
  trustedForwarders: Address[];
  tokenAddress: Address;
  merkleRoot: Hex;
  totalAirdropAmount: bigint;
  expirationTimestamp: bigint;
  openClaimLimitPerWallet: bigint;
  adminPrivateKey: Address;
}) {
  const walletClient = getWalletClient({
    chainId,
    privateKey: adminPrivateKey
  });

  const publicClient = getPublicClient(chainId);

  if (!walletClient.account) throw new Error('Wallet not found');

  const initData = encodeFunctionData({
    abi: THIRDWEB_ERC20_AIRDROP_IMPLEMENTATION_ABI,
    functionName: 'initialize',
    args: [
      trustedForwarders,
      walletClient.account.address,
      tokenAddress,
      totalAirdropAmount,
      expirationTimestamp,
      openClaimLimitPerWallet,
      merkleRoot
    ]
  });

  // Generate a unique salt for the proxy deployment
  const salt = `0x${Date.now().toString(16).padStart(64, '0')}` as Hex;

  // Deploy the proxy
  const { request } = await publicClient.simulateContract({
    address: proxyFactoryAddress,
    abi: THIRDWEB_ERC20_AIRDROP_PROXY_ABI,
    functionName: 'deployProxyByImplementationV2',
    args: [implementationAddress, initData, salt, '0x'],
    account: walletClient.account
  });

  const deployTxHash = await walletClient.writeContract(request);

  let proxyAddress: Address | null = null;
  let blockNumber = BigInt(0);

  for (let i = 0; i < 10; i++) {
    try {
      const receipt = await publicClient.getTransactionReceipt({
        hash: deployTxHash
      });

      blockNumber = receipt.blockNumber;

      proxyAddress = receipt.logs[1]?.address as Address;

      if (proxyAddress) {
        break;
      }
    } catch (error) {
      log.warn('Proxy deployment failed, retrying...', { retry: i });
    } finally {
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    }
  }

  if (!proxyAddress) throw new Error('Proxy deployment failed');

  return {
    proxyAddress,
    deployTxHash,
    blockNumber
  };
}
