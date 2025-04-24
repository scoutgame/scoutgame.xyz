import { log } from '@charmverse/core/log';
import { type BuilderNftType } from '@charmverse/core/prisma-client';
import { getAlchemyBaseUrl } from '@packages/blockchain/getAlchemyBaseUrl';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getNFTContractAddress, getStarterNFTContractAddress } from '@packages/scoutgame/builderNfts/constants';
import { prefix0x } from '@packages/utils/prefix0x';
import { prettyPrint } from '@packages/utils/strings';
import SafeApiKit from '@safe-global/api-kit';
import Safe from '@safe-global/protocol-kit';
import type { MetaTransactionData } from '@safe-global/types-kit';
import { OperationType } from '@safe-global/types-kit';
import type { Address } from 'viem';
import { encodeFunctionData, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

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
  const starterPackNftContractAddress = getStarterNFTContractAddress('2025-W02')!;
  const preseason02NftContractAddress = getNFTContractAddress('2025-W02')!;

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
    log.info('EAS explanation transaction validated successfully');
  } catch (error) {
    log.error('Failed to validate EAS explanation transaction', {
      error,
      decodedInput: easTransaction.data,
      justificationText: transactionDescription
    });
    throw new Error('Failed to validate EAS explanation transaction');
  }

  // Aggregate burn amounts by tokenId and holderAddress
  const aggregateBurnAmounts = (transactions: ProposedBurnParams[]) => {
    return transactions.reduce(
      (acc, tx) => {
        const key = `${tx.holderAddress}-${tx.tokenId}`;
        if (!acc[key]) {
          acc[key] = { ...tx, txHashes: [tx.revertedTransactionHash] };
        } else {
          acc[key].amount += tx.amount;
          acc[key].scoutId = tx.scoutId;
          acc[key].txHashes.push(tx.revertedTransactionHash);
        }
        return acc;
      },
      {} as Record<string, ProposedBurnParams & { txHashes: string[] }>
    );
  };

  // Verify balances before proposing transaction
  const aggregatedDefaultNftBurnTransactions = aggregateBurnAmounts(
    burnTransactions.filter((tx) => tx.nftType === 'default')
  );
  const aggregatedStarterPackBurnTransactions = aggregateBurnAmounts(
    burnTransactions.filter((tx) => tx.nftType === 'starter_pack')
  );

  const publicClient = getPublicClient(chainId);

  const insufficientBalances: {
    holderAddress: string;
    tokenId: number;
    required: bigint;
    available: bigint;
    nftType: 'default' | 'starter_pack';
    txHashes: string[];
  }[] = [];

  if (Object.keys(aggregatedDefaultNftBurnTransactions).length > 0) {
    const args = [
      Object.values(aggregatedDefaultNftBurnTransactions).map((tx) => tx.holderAddress),
      Object.values(aggregatedDefaultNftBurnTransactions).map((tx) => BigInt(tx.tokenId))
    ];

    const defaultBalances = (await publicClient.readContract({
      address: preseason02NftContractAddress,
      abi: transferrableNftBurnAbi,
      functionName: 'balanceOfBatch',
      args
    })) as bigint[];

    Object.values(aggregatedDefaultNftBurnTransactions).forEach((tx, i) => {
      if (defaultBalances[i] < tx.amount) {
        insufficientBalances.push({
          holderAddress: tx.holderAddress,
          tokenId: tx.tokenId,
          required: BigInt(tx.amount),
          available: defaultBalances[i],
          nftType: 'default',
          txHashes: tx.txHashes
        });
      }
    });
  }

  if (Object.keys(aggregatedStarterPackBurnTransactions).length > 0) {
    const args = [
      Object.values(aggregatedStarterPackBurnTransactions).map((tx) => tx.holderAddress),
      Object.values(aggregatedStarterPackBurnTransactions).map((tx) => BigInt(tx.tokenId))
    ];

    const starterPackBalances = (await publicClient.readContract({
      address: starterPackNftContractAddress,
      abi: starterPackBurnAbi,
      functionName: 'balanceOfBatch',
      args
    })) as bigint[];

    Object.values(aggregatedStarterPackBurnTransactions).forEach((tx, i) => {
      if (starterPackBalances[i] < tx.amount) {
        insufficientBalances.push({
          holderAddress: tx.holderAddress,
          tokenId: tx.tokenId,
          required: BigInt(tx.amount),
          available: starterPackBalances[i],
          nftType: 'starter_pack',
          txHashes: tx.txHashes
        });
      }
    });
  }

  if (insufficientBalances.length > 0) {
    prettyPrint({ insufficientBalances });
    throw new Error(`Insufficient balances detected for ${insufficientBalances.length} burn transactions`);
  }

  // Proceed with proposing transactions only if all balances are sufficient
  for (const burnTransaction of burnTransactions) {
    const { tokenId, amount, nftType, scoutId, holderAddress } = burnTransaction;
    const contractAddress = nftType === 'starter_pack' ? starterPackNftContractAddress : preseason02NftContractAddress;
    const args = [holderAddress, BigInt(tokenId), BigInt(amount)];

    if (nftType === 'starter_pack') {
      args.push(scoutId!);
    }

    const encodedBurnData = encodeFunctionData({
      abi: nftType === 'starter_pack' ? starterPackBurnAbi : transferrableNftBurnAbi,
      functionName: 'burn',
      args
    });

    const txData = {
      to: getAddress(contractAddress!),
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

  const safeTransaction = await protocolKitProposer.createTransaction({
    transactions: safeTransactionData,
    options: {
      nonce: 3
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
