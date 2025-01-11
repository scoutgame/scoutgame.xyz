import { log } from '@charmverse/core/log';
import { type BuilderNftType } from '@charmverse/core/prisma-client';
import { getAlchemyBaseUrl } from '@packages/blockchain/getAlchemyBaseUrl';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { prefix0x } from '@packages/utils/prefix0x';
import SafeApiKit from '@safe-global/api-kit';
import Safe from '@safe-global/protocol-kit';
import type { MetaTransactionData } from '@safe-global/types-kit';
import { OperationType } from '@safe-global/types-kit';
import type { Address } from 'viem';
import { encodeFunctionData, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { getBuilderNftContractAddress, getBuilderNftStarterPackContractAddress } from './constants';
import { prepareTransactionExplanation } from './prepareTransactionEASExplanation';

const balanceOfBatchAbi = {
  inputs: [
    { internalType: 'address[]', name: 'accounts', type: 'address[]' },
    { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' }
  ],
  name: 'balanceOfBatch',
  outputs: [{ internalType: 'uint256[]', name: 'balances', type: 'uint256[]' }],
  stateMutability: 'view',
  type: 'function'
};
const starterPackBurnAbi = [
  balanceOfBatchAbi,
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      },
      {
        internalType: 'string',
        name: 'scout',
        type: 'string'
      }
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

const transferrableNftBurnAbi = [
  balanceOfBatchAbi,
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

export type ProposedBurnParams = {
  revertedTransactionHash: string;
  holderAddress: Address;
  tokenId: number;
  amount: number;
  nftType: BuilderNftType;
  scoutId?: string;
};

const proposerPrivateKey = process.env.SAFE_PROPOSER_PRIVATE_KEY as `0x${string}`;

/**
 * Propose a transaction to execute within gnosis safe
 * @docs https://docs.safe.global/sdk/api-kit/guides/propose-and-confirm-transactions
 */
export async function proposePreSeason02OrStarterPackBurnTransactions({
  chainId,
  burnTransactions,
  safeAddress
}: {
  chainId: number;
  burnTransactions: ProposedBurnParams[];
  safeAddress: Address;
}) {
  // prettyPrint({
  //   proposeParams: {
  //     chainId,
  //     burnTransactions,
  //     safeAddress
  //   }
  // });

  const starterPackNftContractAddress = getBuilderNftStarterPackContractAddress('2025-W02');
  const preseason02NftContractAddress = getBuilderNftContractAddress('2025-W02');

  const protocolKitProposer = await Safe.init({
    provider: getAlchemyBaseUrl(chainId),
    signer: proposerPrivateKey,
    safeAddress
  });

  const apiKit = new SafeApiKit({
    chainId: BigInt(chainId)
  });

  const estimationErrors: { error: Error; decodedInput: string; burnParams: ProposedBurnParams }[] = [];
  const safeTransactionData: MetaTransactionData[] = [];

  log.info(`Building and validating ${burnTransactions.length} burn transactions`);

  const transactionDescription = `This transaction reverts ${burnTransactions.length} mint transactions paid for in points that came from unfair gameplay via botting.
  The transactions are\r\n
  ${burnTransactions.map((tx) => `${tx.revertedTransactionHash.replace('0x', '')}`).join(',\r\n ')}`;

  const easTransaction = prepareTransactionExplanation({ justificationText: transactionDescription });

  // Validate EAS transaction
  try {
    await apiKit.estimateSafeTransaction(safeAddress, easTransaction);
    safeTransactionData.push(easTransaction);
    log.info('EAS explanation transaction validated successfully', {
      safeTransactionData
    });
  } catch (error) {
    log.error('Failed to validate EAS explanation transaction', {
      error,
      decodedInput: easTransaction.data,
      justificationText: transactionDescription
    });
    throw new Error('Failed to validate EAS explanation transaction');
  }

  // Create and validate transactions
  for (const burnTransaction of burnTransactions) {
    const { tokenId, amount, nftType, scoutId, holderAddress } = burnTransaction;
    const contractAddress = nftType === 'starter_pack' ? starterPackNftContractAddress : preseason02NftContractAddress;
    const args = [holderAddress, BigInt(tokenId), BigInt(amount)];

    if (nftType === 'starter_pack') {
      if (!scoutId) {
        throw new Error(`Scout ID is required for starter pack burn. Missing scoutId for ${holderAddress}`);
      }
      args.push(scoutId);
    }

    const encodedBurnData = encodeFunctionData({
      abi: nftType === 'starter_pack' ? starterPackBurnAbi : transferrableNftBurnAbi,
      functionName: 'burn',
      args
    });

    const txData = {
      to: getAddress(contractAddress),
      data: encodedBurnData,
      operation: OperationType.Call,
      value: '0'
    };

    try {
      // Estimate the transaction to validate it
      await apiKit.estimateSafeTransaction(safeAddress, txData);
      safeTransactionData.push(txData);
    } catch (error) {
      estimationErrors.push({
        error: error as Error,
        decodedInput: encodedBurnData,
        burnParams: burnTransaction
      });
      log.error(`Failed to validate burn transaction`, {
        error,
        decodedInput: encodedBurnData,
        burnParams: burnTransaction
      });
    }
  }

  if (estimationErrors.length > 0) {
    log.error(`${estimationErrors.length} burn transactions failed validation`, { estimationErrors });
    throw new Error(`Failed to validate ${estimationErrors.length} burn transactions`);
  }

  if (safeTransactionData.length === 0) {
    throw new Error('No valid transactions to propose');
  }

  // Verify balances before proposing transaction
  const defaultNftBurnTransactions = burnTransactions.filter((tx) => tx.nftType === 'default');
  const starterPackBurnTransactions = burnTransactions.filter((tx) => tx.nftType === 'starter_pack');

  const publicClient = getPublicClient(chainId);

  const insufficientBalances: {
    holderAddress: string;
    tokenId: number;
    required: number;
    available: bigint;
    nftType: 'default' | 'starter_pack';
  }[] = [];

  if (defaultNftBurnTransactions.length > 0) {
    const args = [
      defaultNftBurnTransactions.map((tx) => tx.holderAddress),
      defaultNftBurnTransactions.map((tx) => BigInt(tx.tokenId))
    ];

    const defaultBalances = (await publicClient.readContract({
      address: preseason02NftContractAddress,
      abi: transferrableNftBurnAbi,
      functionName: 'balanceOfBatch',
      args
    })) as bigint[];

    defaultNftBurnTransactions.forEach((tx, i) => {
      if (defaultBalances[i] < BigInt(tx.amount)) {
        insufficientBalances.push({
          holderAddress: tx.holderAddress,
          tokenId: tx.tokenId,
          required: tx.amount,
          available: defaultBalances[i],
          nftType: 'default'
        });
      }
    });
  }

  if (starterPackBurnTransactions.length > 0) {
    const starterPackBalances = (await publicClient.readContract({
      address: starterPackNftContractAddress,
      abi: starterPackBurnAbi,
      functionName: 'balanceOfBatch',
      args: [
        starterPackBurnTransactions.map((tx) => tx.holderAddress),
        starterPackBurnTransactions.map((tx) => BigInt(tx.tokenId))
      ]
    })) as bigint[];

    starterPackBurnTransactions.forEach((tx, i) => {
      if (starterPackBalances[i] < BigInt(tx.amount)) {
        insufficientBalances.push({
          holderAddress: tx.holderAddress,
          tokenId: tx.tokenId,
          required: tx.amount,
          available: starterPackBalances[i],
          nftType: 'starter_pack'
        });
      }
    });
  }

  if (insufficientBalances.length > 0) {
    log.error('Found insufficient balances for some burn transactions', { insufficientBalances });
    throw new Error(`Insufficient balances detected for ${insufficientBalances.length} burn transactions`);
  }

  const safeTransaction = await protocolKitProposer.createTransaction({
    transactions: safeTransactionData,
    options: {
      nonce: 2
    }
  });

  log.info('Generated safe transaction input data');

  const safeTxHash = await protocolKitProposer.getTransactionHash(safeTransaction);
  const signature = await protocolKitProposer.signHash(safeTxHash);

  const proposerAddress = privateKeyToAccount(prefix0x(proposerPrivateKey)).address;

  log.info(`Proposing transaction to safe with hash ${safeTxHash}`);

  // Propose transaction to the service
  await apiKit.proposeTransaction({
    safeAddress,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: proposerAddress,
    senderSignature: signature.data
  });

  log.info(`Transaction proposed to safe`, { safeTxHash, proposerAddress, safeAddress });
}
