import type { NFTPurchaseEvent } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import type { TransferSingleEvent } from '@packages/scoutgame/builderNfts/accounting/getTransferSingleEvents';
import { prefix0x } from '@packages/utils/prefix0x';
import type { Address } from 'viem';

export function uniqueNftPurchaseEventKey(
  event: Pick<TransferSingleEvent, 'transactionHash' | 'logIndex'> & {
    args: Pick<TransferSingleEvent['args'], 'id' | 'value'> & {
      from: Address | null;
      to: Address | null;
    };
  }
) {
  return `${event.args.id}-${event.args.value}-${!event.args.from ? NULL_EVM_ADDRESS : event.args.from.toLowerCase()}-${!event.args.to ? NULL_EVM_ADDRESS : event.args.to.toLowerCase()}-${prefix0x(event.transactionHash.toLowerCase())}-${event.logIndex}`;
}

export function getMatchingNFTPurchaseEvent(
  params: Pick<
    NFTPurchaseEvent,
    'txHash' | 'txLogIndex' | 'senderWalletAddress' | 'walletAddress' | 'tokensPurchased' | 'builderNftId'
  >
) {
  return prisma.nFTPurchaseEvent.findFirst({
    where: {
      // Checking for same tx and position inside tx (one transaction can have multiple events)
      txHash: params.txHash,
      txLogIndex: params.txLogIndex,
      // Checking for to and from
      senderWalletAddress:
        !params.senderWalletAddress || params.senderWalletAddress === NULL_EVM_ADDRESS
          ? null
          : {
              equals: params.senderWalletAddress,
              mode: 'insensitive'
            },
      walletAddress:
        !params.walletAddress || params.walletAddress === NULL_EVM_ADDRESS
          ? null
          : {
              equals: params.walletAddress,
              mode: 'insensitive'
            },
      // Checking this is same NFT and amount of tokens purchased
      tokensPurchased: params.tokensPurchased,
      builderNftId: params.builderNftId
    }
  });
}
