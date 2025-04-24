import { log } from '@charmverse/core/log';
import { NFTPurchaseEvent, prisma } from '@charmverse/core/prisma-client';
import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import { TransferSingleEvent } from '@packages/scoutgame/builderNfts/accounting/getTransferSingleEvents';
import { getTransferSingleWithBatchMerged } from '@packages/scoutgame/builderNfts/accounting/getTransferSingleWithBatchMerged';
import { getNFTContractAddress, getStarterNFTContractAddress } from '@packages/scoutgame/builderNfts/constants';
import { uniqueNftPurchaseEventKey } from '@packages/scoutgame/builderNfts/getMatchingNFTPurchaseEvent';
import { findOrCreateWalletUser } from '@packages/users/findOrCreateWalletUser';
import { optimism } from 'viem/chains';

async function migrateNftPurchaseEvents() {
  async function handleTransferSingleEvent({
    onchainEvent,
    purchaseEvent
  }: {
    onchainEvent: TransferSingleEvent;
    purchaseEvent: Pick<
      NFTPurchaseEvent,
      'id' | 'tokensPurchased' | 'senderWalletAddress' | 'walletAddress' | 'builderNftId' | 'txHash' | 'txLogIndex'
    >;
  }) {
    // // Don't reindex reverted mint transactions
    // if (ignoredTxAttestations.some(attestation => attestation.transactionHashesMap[onchainEvent.transactionHash.toLowerCase()])) {
    //   return;
    // }

    const senderWallet = onchainEvent.args.from !== NULL_EVM_ADDRESS ? onchainEvent.args.from.toLowerCase() : null;
    const recipientWallet = onchainEvent.args.to !== NULL_EVM_ADDRESS ? onchainEvent.args.to.toLowerCase() : null;

    const recipientWalletUser = recipientWallet
      ? await findOrCreateWalletUser({
          wallet: recipientWallet
        })
      : null;

    const senderWalletUser = senderWallet
      ? await findOrCreateWalletUser({
          wallet: senderWallet
        })
      : null;

    await prisma.nFTPurchaseEvent.update({
      where: {
        id: purchaseEvent.id
      },
      data: {
        // Remove the scout relationship and use wallets instead
        walletAddress: recipientWallet,
        senderWalletAddress: senderWallet,
        txLogIndex: onchainEvent.logIndex
      }
    });
  }

  async function handleMigration(season: string) {
    const contracts = [getNFTContractAddress(season), getStarterNFTContractAddress(season)];

    for (const contractAddress of contracts) {
      const selectedSeasonTransferSingles = await getTransferSingleWithBatchMerged({
        fromBlock: 126_000_000,
        chainId: optimism.id,
        contractAddress: contractAddress
      });

      const selectedSeasonPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
        where: {
          builderNft: {
            contractAddress: {
              equals: contractAddress,
              mode: 'insensitive'
            }
          },
          txLogIndex: null,
          builderEvent: {
            season
          }
        },
        select: {
          txHash: true,
          id: true,
          tokensPurchased: true,
          senderWalletAddress: true,
          walletAddress: true,
          builderNftId: true,
          builderNft: {
            select: {
              tokenId: true
            }
          },
          txLogIndex: true
        }
      });

      // We don't have the log index in NFT Purchase Events yet, so we'll use a shared log index for all events
      const sharedLogIndex = -1;

      // We don't have the from and to addresses in NFT Purchase Events yet, so we'll use a stub address for all events
      const stubAddress = '0xstub';

      const selectedSeasonScoutedTxHashes = selectedSeasonTransferSingles.reduce<Record<string, TransferSingleEvent>>(
        (acc, event) => {
          acc[
            uniqueNftPurchaseEventKey({
              ...event,
              args: { ...event.args, from: stubAddress, to: stubAddress, operator: stubAddress },
              logIndex: sharedLogIndex
            })
          ] = event;
          return acc;
        },
        {}
      );

      if (!Object.keys(selectedSeasonScoutedTxHashes).length) {
        log.error('No selectedSeasonScoutedTxHashes found');
        continue;
      }

      for (let i = 0; i < selectedSeasonPurchaseEvents.length; i++) {
        log.info(`Migrating Season ${season} - Builder NFT ${i} of ${selectedSeasonPurchaseEvents.length}`);
        const purchaseEvent = selectedSeasonPurchaseEvents[i];

        const from = purchaseEvent.senderWalletAddress ?? NULL_EVM_ADDRESS;
        const to = purchaseEvent.walletAddress ?? NULL_EVM_ADDRESS;

        const key = uniqueNftPurchaseEventKey({
          transactionHash: purchaseEvent.txHash as `0x${string}`,
          args: {
            from: stubAddress,
            to: stubAddress,
            id: BigInt(purchaseEvent.builderNft.tokenId),
            value: BigInt(purchaseEvent.tokensPurchased),
            operator: stubAddress
          },
          logIndex: sharedLogIndex
        });

        const onchainEvent = selectedSeasonScoutedTxHashes[key];

        if (onchainEvent) {
          log.info('Found onchain event for purchase event', { purchaseEvent, onchainEvent });
          await handleTransferSingleEvent({ onchainEvent, purchaseEvent });
        } else {
          log.error('No onchain event found for purchase event', { purchaseEvent });
        }
      }
    }
  }

  const seasons = ['2024-W41', '2025-W02'];

  await Promise.all(seasons.map((season) => handleMigration(season)));
}

migrateNftPurchaseEvents().then(console.log).catch(console.error);
