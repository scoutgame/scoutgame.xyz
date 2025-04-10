import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { Address, Hex, WalletClient } from 'viem';

import type { Recipient } from './createThirdwebAirdropContract';

export type ThirdwebFullMerkleTree = {
  rootHash: string;
  recipients: Recipient[];
  layers: string[];
  totalAirdropAmount: string;
  totalRecipients: number;
};

export const THIRDWEB_ERC20_AIRDROP_PROXY_ABI = [
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

export const THIRDWEB_ERC20_AIRDROP_IMPLEMENTATION_ABI = [
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
  },
  {
    name: 'verifyClaim',
    inputs: [
      { type: 'address', name: '_claimer' },
      { type: 'uint256', name: '_quantity' },
      { type: 'bytes32[]', name: '_proofs' },
      { type: 'uint256', name: '_proofMaxQuantityForWallet' }
    ],
    outputs: [],
    stateMutability: 'view',
    type: 'function'
  },
  {
    name: 'claim',
    inputs: [
      { type: 'address', name: '_receiver' },
      { type: 'uint256', name: '_quantity' },
      { type: 'bytes32[]', name: '_proofs' },
      { type: 'uint256', name: '_proofMaxQuantityForWallet' }
    ],
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    name: 'airdropTokenAddress',
    inputs: [],
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    name: 'tokenOwner',
    inputs: [],
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    name: 'availableAmount',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    name: 'expirationTimestamp',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    name: 'openClaimLimitPerWallet',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    name: 'merkleRoot',
    inputs: [],
    outputs: [{ type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    name: 'supplyClaimedByWallet',
    inputs: [{ type: 'address', name: 'wallet' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    name: 'isTrustedForwarder',
    inputs: [{ type: 'address', name: 'forwarder' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    type: 'event',
    name: 'TokensClaimed',
    inputs: [
      { type: 'address', name: 'claimer', indexed: true },
      { type: 'address', name: 'receiver', indexed: true },
      { type: 'uint256', name: 'quantityClaimed', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'Initialized',
    inputs: [{ type: 'uint8', name: 'version', indexed: false }]
  }
];

export async function getThirdwebERC20AirdropExpirationTimestamp({
  airdropContractAddress,
  chainId
}: {
  airdropContractAddress: Address;
  chainId: number;
}): Promise<bigint> {
  const publicClient = getPublicClient(chainId);

  const expirationTimestamp = await publicClient.readContract({
    address: airdropContractAddress,
    abi: THIRDWEB_ERC20_AIRDROP_IMPLEMENTATION_ABI,
    functionName: 'expirationTimestamp'
  });

  return expirationTimestamp as bigint;
}

// Function to verify claim eligibility
export async function verifyThirdwebERC20AirdropClaimEligibility({
  airdropContractAddress,
  claimer,
  quantity,
  proofs,
  proofMaxQuantityForWallet,
  chainId
}: {
  airdropContractAddress: Address;
  claimer: string;
  quantity: bigint;
  proofs: Hex[];
  proofMaxQuantityForWallet: bigint;
  chainId: number;
}): Promise<boolean> {
  const publicClient = getPublicClient(chainId);

  await publicClient.readContract({
    address: airdropContractAddress,
    abi: THIRDWEB_ERC20_AIRDROP_IMPLEMENTATION_ABI,
    functionName: 'verifyClaim',
    args: [claimer, quantity, proofs, proofMaxQuantityForWallet]
  });

  return true;
}

// Function to claim tokens
export async function claimThirdwebERC20AirdropToken({
  airdropContractAddress,
  receiver,
  quantity,
  proofs,
  proofMaxQuantityForWallet,
  chainId,
  walletClient
}: {
  airdropContractAddress: Address;
  receiver: string;
  quantity: bigint;
  proofs: Hex[];
  // Max amount receiver can claim by default its the total amount
  proofMaxQuantityForWallet?: bigint;
  chainId: number;
  walletClient: WalletClient;
}): Promise<Address> {
  const publicClient = getPublicClient(chainId);

  // Simulate the transaction first
  const simulationResult = await publicClient.simulateContract({
    address: airdropContractAddress,
    abi: THIRDWEB_ERC20_AIRDROP_IMPLEMENTATION_ABI,
    functionName: 'claim',
    args: [receiver, quantity, proofs, proofMaxQuantityForWallet || quantity],
    account: walletClient.account
  });

  const claimTx = await walletClient.writeContract(simulationResult.request);
  return claimTx;
}
