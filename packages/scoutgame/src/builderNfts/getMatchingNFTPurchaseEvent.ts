import type { NFTPurchaseEvent } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { NULL_EVM_ADDRESS } from '@charmverse/core/protocol';

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
        params.senderWalletAddress === NULL_EVM_ADDRESS
          ? null
          : {
              equals: params.senderWalletAddress,
              mode: 'insensitive'
            },
      walletAddress:
        params.walletAddress === NULL_EVM_ADDRESS
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
