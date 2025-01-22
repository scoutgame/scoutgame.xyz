import { NFTPurchaseEvent, prisma } from '@charmverse/core/prisma-client';
import { BuilderScoutedEvent, getBuilderScoutedEvents } from '@packages/scoutgame/builderNfts/accounting/getBuilderScoutedEvents';
import {  getTransferSingleEvents, TransferSingleEvent } from '@packages/scoutgame/builderNfts/accounting/getTransferSingleEvents';
import { getBuilderNftContractAddress, getBuilderNftStarterPackContractAddress } from '@packages/scoutgame/builderNfts/constants';
import { optimism } from 'viem/chains';
import { findOrCreateWalletUser } from '@packages/users/findOrCreateWalletUser';
import { Address } from 'viem';
import {getRevertedMintTransactionAttestations} from '@packages/safetransactions/getRevertedMintTransactionAttestations'
import { NULL_EVM_ADDRESS } from '@charmverse/core/protocol';

async function migrateNftPurchaseEvents() {

  const ignoredTxAttestations = await getRevertedMintTransactionAttestations();

  // Handle Season 01 ------------
  const preseason01 = '2024-W41'
  async function handleTransferSingleEvent({onchainEvent, purchaseEvent}: {onchainEvent: TransferSingleEvent, purchaseEvent: NFTPurchaseEvent}) {

    // Don't reindex reverted mint transactions
    if (ignoredTxAttestations.some(attestation => attestation.transactionHashesMap[onchainEvent.transactionHash])) {
      return;
    }

    const senderWallet = onchainEvent.args.from !== NULL_EVM_ADDRESS ? onchainEvent.args.from : null;
    const recipientWallet = onchainEvent.args.to !== NULL_EVM_ADDRESS ? onchainEvent.args.to : null;

    const recipientWalletUser = recipientWallet ? await findOrCreateWalletUser({
      wallet: recipientWallet
    }) : null;

    const senderWalletUser = senderWallet ? await findOrCreateWalletUser({
      wallet: senderWallet
    }) : null;

    await prisma.nFTPurchaseEvent.update({
      where: {
        id: purchaseEvent.id
      },
      data: {
        // Remove the scout relationship and use wallets instead
        walletAddress: recipientWallet,
        senderWalletAddress: senderWallet
      }
    })
  }

  // Season 01 - Builder NFT starter packs

  const preseason01BuilderNftContractAddress = getBuilderNftContractAddress(preseason01);

  const transferSingles = await getTransferSingleEvents({
    chainId: optimism.id,
    contractAddress: preseason01BuilderNftContractAddress
  });

  const season01PurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderNft: {
        contractAddress: preseason01BuilderNftContractAddress
      },
      builderEvent: {
        season: preseason01
      }
    }
  });

  const season01ScoutedTxHashes = transferSingles.reduce<Record<string, TransferSingleEvent>>((acc, event) => {
    acc[event.transactionHash] = event;
    return acc;
  }, {});

  for (let i = 0; i < season01PurchaseEvents.length; i++) {
    const purchaseEvent = season01PurchaseEvents[i];

    const onchainEvent = season01ScoutedTxHashes[purchaseEvent.txHash]

    if (onchainEvent) {
      await handleTransferSingleEvent({onchainEvent, purchaseEvent})
    }
  }


  // Season 01 - Starter Pack NFTs
  const starterPackContractAddress = getBuilderNftStarterPackContractAddress(preseason01);

  const starterPackTransferSingles = await getTransferSingleEvents({
    chainId: optimism.id,
    contractAddress: starterPackContractAddress
  });

  const starterPackPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderNft: {
        contractAddress: starterPackContractAddress
      },
      builderEvent: {
        season: preseason01
      }
    }
  });

  const starterPackScoutedTxHashes = starterPackTransferSingles.reduce<Record<string, TransferSingleEvent>>((acc, event) => {
    acc[event.transactionHash] = event;
    return acc;
  }, {});

  for (let i = 0; i < starterPackPurchaseEvents.length; i++) {
    const purchaseEvent = starterPackPurchaseEvents[i];

    const onchainEvent = starterPackScoutedTxHashes[purchaseEvent.txHash];

    if (onchainEvent) {
      await handleTransferSingleEvent({onchainEvent, purchaseEvent});
    }
  }

  // Season 02 - Builder NFTs
  const preseason02 = '2025-W02'
  const preseason02BuilderNftContractAddress = getBuilderNftContractAddress(preseason02);

  const preseason02TransferSingles = await getTransferSingleEvents({
    chainId: optimism.id,
    contractAddress: preseason02BuilderNftContractAddress
  });

  const season02PurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderNft: {
        contractAddress: preseason02BuilderNftContractAddress
      },
      builderEvent: {
        season: preseason02
      }
    }
  });

  const preseason02ScoutedTxHashes = preseason02TransferSingles.reduce<Record<string, TransferSingleEvent>>((acc, event) => {
    acc[event.transactionHash] = event;
    return acc;
  }, {});

  for (let i = 0; i < season02PurchaseEvents.length; i++) {
    const purchaseEvent = season02PurchaseEvents[i];

    const onchainEvent = preseason02ScoutedTxHashes[purchaseEvent.txHash];

    if (onchainEvent) {
      await handleTransferSingleEvent({onchainEvent, purchaseEvent});
    }
  }


  // Season 02 - Starter Pack NFTs
  const preseason02StarterPackContractAddress = getBuilderNftStarterPackContractAddress(preseason02);

  const preseason02StarterPackTransferSingles = await getTransferSingleEvents({
    chainId: optimism.id,
    contractAddress: preseason02StarterPackContractAddress
  });

  const preseason02StarterPackPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderNft: {
        contractAddress: preseason02StarterPackContractAddress
      },
      builderEvent: {
        season: preseason02
      }
    }
  });

  const preseason02StarterPackScoutedTxHashes = preseason02StarterPackTransferSingles.reduce<Record<string, TransferSingleEvent>>((acc, event) => {
    acc[event.transactionHash] = event;
    return acc;
  }, {});

  for (let i = 0; i < preseason02StarterPackPurchaseEvents.length; i++) {
    const purchaseEvent = preseason02StarterPackPurchaseEvents[i];

    const onchainEvent = preseason02StarterPackScoutedTxHashes[purchaseEvent.txHash];

    if (onchainEvent) {
      await handleTransferSingleEvent({onchainEvent, purchaseEvent});
    }
  }
}
