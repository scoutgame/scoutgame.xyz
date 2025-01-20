import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { NULL_EVM_ADDRESS } from '@charmverse/core/protocol';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import type { TransferSingleEvent } from '@packages/scoutgame/builderNfts/accounting/getTransferSingleEvents';
import {
  getStarterPackTransferSingleEvents,
  getTransferSingleEvents
} from '@packages/scoutgame/builderNfts/accounting/getTransferSingleEvents';
import { getPreSeasonTwoBuilderNftContractReadonlyClient } from '@packages/scoutgame/builderNfts/clients/preseason02/getPreSeasonTwoBuilderNftContractReadonlyClient';
import { getBuilderNftStarterPackReadonlyClient } from '@packages/scoutgame/builderNfts/clients/starterPack/getBuilderContractStarterPackReadonlyClient';
import { getBuilderNftContractAddressForNftType } from '@packages/scoutgame/builderNfts/constants';
import { recordNftMint } from '@packages/scoutgame/builderNfts/recordNftMint';
import { recordNftTransfer } from '@packages/scoutgame/builderNfts/recordNftTransfer';
import { convertCostToPoints } from '@packages/scoutgame/builderNfts/utils';
import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';
import { findOrCreateWalletUser } from '@packages/users/findOrCreateWalletUser';

// Deploy date for new version of contract Jan 03 2025
const startBlockNumberForReindexing = 130_157_497;

export async function findAndIndexMissingPurchases({
  nftType,
  season = getCurrentSeasonStart()
}: {
  nftType: BuilderNftType;
  season?: ISOWeek;
}) {
  const contractAddress = getBuilderNftContractAddressForNftType({ nftType, season });

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
      by: ['txHash'],
      where: {
        builderNft: {
          season
        }
      }
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

  const allTokenIdsAsString = Object.keys(groupedByTokenId);

  const nfts = await prisma.builderNft.findMany({
    where: {
      tokenId: {
        in: allTokenIdsAsString.map((key) => Number(key))
      },
      nftType,
      season
    }
  });

  for (const key of allTokenIdsAsString) {
    for (const missingTx of groupedByTokenId[key as any].records) {
      scoutgameMintsLogger.error('Missing tx', missingTx.transactionHash, 'tokenId', key);

      // Null to means this is a burn, which impacts the total supply. Not null from means this is a transfer from an existing wallet
      if (missingTx.args.to === NULL_EVM_ADDRESS || missingTx.args.from !== NULL_EVM_ADDRESS) {
        scoutgameMintsLogger.info('Detected secondary market transfer', missingTx.transactionHash, 'tokenId', key);
        await recordNftTransfer({
          amount: Number(missingTx.args.value),
          contractAddress,
          from: missingTx.args.from,
          to: missingTx.args.to,
          tokenId: Number(missingTx.args.id),
          txHash: missingTx.transactionHash
        });
        // eslint-disable-next-line no-continue
        continue;
      }

      const matchingNft = nfts.find((nft) => nft.tokenId === Number(key));

      if (!matchingNft) {
        scoutgameMintsLogger.error(`NFT with tokenId ${key} not found`);
        // eslint-disable-next-line no-continue
        continue;
      }

      const price = await (nftType === BuilderNftType.starter_pack
        ? getBuilderNftStarterPackReadonlyClient().getTokenPurchasePrice({
            args: {
              amount: BigInt(missingTx.args.value)
            },
            blockNumber: missingTx.blockNumber
          })
        : getPreSeasonTwoBuilderNftContractReadonlyClient().getTokenPurchasePrice({
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

// findAndIndexMissingPurchases({ nftType: BuilderNftType.default }).then(console.log);
