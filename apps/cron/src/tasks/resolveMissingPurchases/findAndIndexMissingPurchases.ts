import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import type { TransferSingleEvent } from '@packages/scoutgame/builderNfts/accounting/getTransferSingleEvents';
import {
  getStarterPackTransferSingleEvents,
  getTransferSingleEvents
} from '@packages/scoutgame/builderNfts/accounting/getTransferSingleEvents';
import { builderContractReadonlyApiClient } from '@packages/scoutgame/builderNfts/clients/builderContractReadClient';
import { builderContractStarterPackReadonlyApiClient } from '@packages/scoutgame/builderNfts/clients/builderContractStarterPackReadClient';
import { recordNftMint } from '@packages/scoutgame/builderNfts/recordNftMint';
import { convertCostToPoints } from '@packages/scoutgame/builderNfts/utils';
import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';
import { findOrCreateWalletUser } from '@packages/scoutgame/users/findOrCreateWalletUser';

// Deploy date for new version of contract Jan 03 2025
const startBlockNumberForReindexing = 130_157_497;

export async function findAndIndexMissingPurchases({ nftType }: { nftType: BuilderNftType }) {
  const transferSingleEvents = await (nftType === BuilderNftType.starter_pack
    ? getStarterPackTransferSingleEvents({ fromBlock: startBlockNumberForReindexing })
    : getTransferSingleEvents({ fromBlock: startBlockNumberForReindexing }));

  const transferSingleEventsMapped = transferSingleEvents.reduce(
    (acc, val) => {
      acc[val.transactionHash] = val;

      return acc;
    },
    {} as Record<string, TransferSingleEvent>
  );

  const missingEvents: typeof transferSingleEvents = [];

  const uniqueTxHashes = await prisma.nFTPurchaseEvent
    .groupBy({
      by: ['txHash']
    })
    .then((transactions) => new Set(transactions.map((tx) => tx.txHash)));

  for (const event of transferSingleEvents) {
    if (!uniqueTxHashes.has(event.transactionHash)) {
      missingEvents.push(event);
    }
  }

  // Early exit
  if (!missingEvents.length) {
    scoutgameMintsLogger.info('No missing events found');
    return;
  }

  scoutgameMintsLogger.error(`Found ${missingEvents.length} missing events`);

  const groupedByTokenId = missingEvents.reduce(
    (acc, val) => {
      const tokenId = Number(val.args.id);

      if (!acc[tokenId]) {
        acc[tokenId] = { records: [] };
      }

      acc[tokenId].records.push(val);

      return acc;
    },
    {} as Record<number, { records: TransferSingleEvent[] }>
  );

  const allTokenIdsAsString = Object.keys(groupedByTokenId).filter((_tokenId) => _tokenId !== '163');

  const nfts = await prisma.builderNft.findMany({
    where: {
      tokenId: {
        in: allTokenIdsAsString.map((key) => Number(key))
      },
      nftType
    }
  });

  for (const key of allTokenIdsAsString) {
    for (const missingTx of groupedByTokenId[key as any].records) {
      scoutgameMintsLogger.error('Missing tx', missingTx.transactionHash, 'tokenId', key);

      const matchingNft = nfts.find((nft) => nft.tokenId === Number(key));

      if (!matchingNft) {
        scoutgameMintsLogger.error(`NFT with tokenId ${key} not found`);
        // eslint-disable-next-line no-continue
        continue;
      }

      const price = await (nftType === BuilderNftType.starter_pack
        ? builderContractStarterPackReadonlyApiClient.getTokenPurchasePrice({
            args: {
              amount: BigInt(missingTx.args.value)
            },
            blockNumber: missingTx.blockNumber
          })
        : builderContractReadonlyApiClient.getTokenPurchasePrice({
            args: { tokenId: BigInt(key), amount: BigInt(missingTx.args.value) },
            blockNumber: missingTx.blockNumber
          }));

      const asPoints = convertCostToPoints(price);

      const address = transferSingleEventsMapped[missingTx.transactionHash].args.to;

      if (!address) {
        scoutgameMintsLogger.error(`Tx ${missingTx.transactionHash} has no recipient address`);
      }

      let scoutId = await prisma.scoutWallet
        .findFirst({ where: { address: address.toLowerCase() } })
        .then((scout) => scout?.scoutId);

      if (!scoutId) {
        scoutgameMintsLogger.info(
          `Scout with unknown address ${address} who minted ${missingTx.args.value} NFTs with tokenId ${missingTx.args.id} at transaction ${missingTx.transactionHash} not found, creating new user`
        );
        scoutId = await findOrCreateWalletUser({ wallet: address }).then((scout) => scout.id);
      }

      await recordNftMint({
        amount: Number(missingTx.args.value),
        scoutId: scoutId as string,
        mintTxHash: missingTx.transactionHash,
        paidWithPoints: false,
        pointsValue: asPoints,
        builderNftId: matchingNft.id,
        recipientAddress: address
      });
    }
  }
}
