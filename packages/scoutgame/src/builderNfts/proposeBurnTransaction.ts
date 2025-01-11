import { log } from '@charmverse/core/log';
import type { BuilderNftType } from '@charmverse/core/prisma-client';
import { getAlchemyBaseUrl } from '@packages/blockchain/getAlchemyBaseUrl';
import { prefix0x } from '@packages/utils/prefix0x';
import SafeApiKit from '@safe-global/api-kit';
import Safe from '@safe-global/protocol-kit';
import type { MetaTransactionData } from '@safe-global/types-kit';
import { OperationType } from '@safe-global/types-kit';
import type { Address, Chain } from 'viem';
import { encodeFunctionData, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { getBuilderNftContractAddress, getBuilderNftStarterPackContractAddress } from './constants';

const starterPackBurnAbi = [
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

const transferrableNftBurnAbi = {
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
};

type BurnParams = {
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
  chain,
  burnTransactions,
  safeAddress
}: {
  chain: Chain;
  burnTransactions: BurnParams[];
  safeAddress: Address;
}) {
  const starterPackNftContractAddress = getBuilderNftStarterPackContractAddress();
  const preseason02NftContractAddress = getBuilderNftContractAddress('2025-W02');

  const protocolKitProposer = await Safe.init({
    provider: getAlchemyBaseUrl(chain.id),
    signer: proposerPrivateKey,
    safeAddress
  });

  // Create transaction
  const safeTransactionData: MetaTransactionData[] = burnTransactions.map((burnTransaction) => {
    const { tokenId, amount, nftType, scoutId, holderAddress } = burnTransaction;
    const contractAddress = nftType === 'starter_pack' ? starterPackNftContractAddress : preseason02NftContractAddress;
    const args = [holderAddress, BigInt(tokenId), BigInt(amount)];

    if (nftType === 'starter_pack') {
      if (!scoutId) {
        throw new Error(`Scout ID is required for starter pack burn. Missing scoutId for ${holderAddress}`);
      }
    }

    const encodedBurnData = encodeFunctionData({
      abi: [nftType === 'starter_pack' ? starterPackBurnAbi : transferrableNftBurnAbi],
      functionName: 'burn',
      args
    });

    return {
      to: getAddress(contractAddress),
      data: encodedBurnData,
      operation: OperationType.Call,
      value: '0'
    };
  });

  const safeTransaction = await protocolKitProposer.createTransaction({
    transactions: safeTransactionData
  });

  log.info('Generated safe transaction input data');

  const safeTxHash = await protocolKitProposer.getTransactionHash(safeTransaction);
  const signature = await protocolKitProposer.signHash(safeTxHash);

  const apiKit = new SafeApiKit({
    chainId: BigInt(chain.id)
  });

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
