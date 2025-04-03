import { log } from '@charmverse/core/log';
import { getChainById } from '@packages/blockchain/chains';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getWalletClient } from '@packages/blockchain/getWalletClient';
import type { Address, SendTransactionOptions } from 'thirdweb';
import { createThirdwebClient, prepareContractCall, readContract, sendTransaction } from 'thirdweb';
import type { Hex } from 'viem';
import { encodeFunctionData, erc20Abi } from 'viem';
import { base } from 'viem/chains';

const thirdwebClient = createThirdwebClient({
  clientId: process.env.THIRDWEB_CLIENT_ID as string,
  secretKey: process.env.THIRDWEB_SECRET_KEY as string
});

const PROXY_DEPLOYMENT_ABI = [
  {
    inputs: [
      { type: 'address', name: 'implementation' },
      { type: 'bytes', name: 'data' },
      { type: 'bytes32', name: 'salt' },
      { type: 'bytes', name: 'extraData' }
    ],
    name: 'deployProxyByImplementationV2',
    outputs: [{ type: 'address', name: 'proxy' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

export async function deployAirdropContract({
  tokenAddress,
  merkleRoot,
  totalAirdropAmount,
  expirationTimestamp,
  openClaimLimitPerWallet,
  trustedForwarders,
  proxyFactoryAddress,
  implementationAddress
}: {
  proxyFactoryAddress: Address;
  implementationAddress: Address;
  trustedForwarders: Address[];
  tokenAddress: Address;
  merkleRoot: Hex;
  totalAirdropAmount: bigint;
  expirationTimestamp: bigint;
  openClaimLimitPerWallet: bigint;
}) {
  const walletClient = getWalletClient({
    chainId: base.id,
    privateKey: process.env.PRIVATE_KEY as `0x${string}`
  });

  const publicClient = getPublicClient(base.id);
  const chain = getChainById(base.id);
  if (!chain) throw new Error('Chain not found');

  if (!walletClient.account) throw new Error('Wallet not found');

  // Encode the initialization data
  const initData = encodeFunctionData({
    abi: [
      {
        inputs: [
          { type: 'address[]', name: '_trustedForwarders' },
          { type: 'address', name: '_tokenOwner' },
          { type: 'address', name: '_airdropTokenAddress' },
          { type: 'uint256', name: '_airdropAmount' },
          { type: 'uint256', name: '_expirationTimestamp' },
          { type: 'uint256', name: '_openClaimLimitPerWallet' },
          { type: 'bytes32', name: '_merkleRoot' }
        ],
        name: 'initialize',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      }
    ],
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
    abi: PROXY_DEPLOYMENT_ABI,
    functionName: 'deployProxyByImplementationV2',
    args: [implementationAddress, initData, salt, '0x'],
    account: walletClient.account
  });

  const deployTx = await walletClient.writeContract(request);

  let proxyAddress = '';

  for (let i = 0; i < 10; i++) {
    try {
      const receipt = await publicClient.getTransactionReceipt({
        hash: deployTx
      });

      proxyAddress = receipt.logs[1]?.address;

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

  return proxyAddress;
}

// Function to verify claim eligibility
export async function verifyClaimEligibility({
  airdropContractAddress,
  claimer,
  quantity,
  proofs,
  proofMaxQuantityForWallet
}: {
  airdropContractAddress: Address;
  claimer: string;
  quantity: bigint;
  proofs: Hex[];
  proofMaxQuantityForWallet: bigint;
}): Promise<boolean> {
  const chain = getChainById(base.id);
  if (!chain) throw new Error('Chain not found');

  try {
    await readContract({
      contract: {
        address: airdropContractAddress,
        client: thirdwebClient,
        chain: {
          ...chain,
          id: base.id,
          testnet: true,
          rpc: chain.rpcUrls[0]
        }
      },
      method: 'function verifyClaim(address,uint256,bytes32[],uint256) view',
      params: [claimer, quantity, proofs, proofMaxQuantityForWallet]
    });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to get merkle root
export async function getMerkleRoot(airdropContractAddress: Address): Promise<Hex> {
  const chain = getChainById(base.id);
  if (!chain) throw new Error('Chain not found');

  const merkleRoot = await readContract({
    contract: {
      address: airdropContractAddress,
      client: thirdwebClient,
      chain: {
        ...chain,
        id: base.id,
        testnet: true,
        rpc: chain.rpcUrls[0]
      }
    },
    method: 'function merkleRoot() view returns (bytes32)',
    params: []
  });

  return merkleRoot as Hex;
}

// Function to approve token spending
export async function approveTokenSpending({
  tokenAddress,
  spenderAddress,
  amount
}: {
  tokenAddress: Address;
  spenderAddress: Address;
  amount: bigint;
}) {
  const chain = getChainById(base.id);
  if (!chain) throw new Error('Chain not found');

  const walletClient = getWalletClient({
    chainId: base.id,
    privateKey: process.env.PRIVATE_KEY as `0x${string}`
  });

  if (!walletClient.account) throw new Error('Wallet not found');

  const approvalTx = await walletClient.writeContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: [spenderAddress, amount],
    chain: base,
    account: walletClient.account
  });

  return approvalTx;
}

// Function to claim tokens
export async function claimTokens({
  airdropContractAddress,
  receiver,
  quantity,
  proofs,
  proofMaxQuantityForWallet
}: {
  airdropContractAddress: Address;
  receiver: string;
  quantity: bigint;
  proofs: Hex[];
  proofMaxQuantityForWallet: bigint;
}): Promise<string> {
  const chain = getChainById(base.id);
  if (!chain) throw new Error('Chain not found');

  // First verify if claim is valid
  const isEligible = await verifyClaimEligibility({
    airdropContractAddress,
    claimer: receiver,
    quantity,
    proofs,
    proofMaxQuantityForWallet
  });

  if (!isEligible) {
    throw new Error('Claim verification failed');
  }

  const transaction = await prepareContractCall({
    contract: {
      address: airdropContractAddress,
      client: thirdwebClient,
      chain: {
        ...chain,
        id: base.id,
        testnet: true,
        rpc: chain.rpcUrls[0]
      }
    },
    method: 'function claim(address,uint256,bytes32[],uint256)',
    params: [receiver, quantity, proofs, proofMaxQuantityForWallet]
  });

  const walletClient = getWalletClient({
    chainId: base.id,
    privateKey: process.env.PRIVATE_KEY as `0x${string}`
  });

  if (!walletClient.account) throw new Error('Wallet not found');

  const { transactionHash } = await sendTransaction({
    transaction,
    account: walletClient.account as unknown as SendTransactionOptions['account']
  });

  return transactionHash;
}
