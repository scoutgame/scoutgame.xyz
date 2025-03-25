import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import { getLastBlockOfWeek } from '@packages/blockchain/getLastBlockOfWeek';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart, getPreviousWeek } from '@packages/dates/utils';
import type { TransferSingleEvent } from '@packages/scoutgame/builderNfts/accounting/getTransferSingleEvents';
import { getTransferSingleWithBatchMerged } from '@packages/scoutgame/builderNfts/accounting/getTransferSingleWithBatchMerged';
import { getBuilderNftContractReadonlyClient } from '@packages/scoutgame/builderNfts/clients/builderNftContractReadonlyClient';
import { getBuilderNftStarterPackReadonlyClient } from '@packages/scoutgame/builderNfts/clients/starterPack/getBuilderContractStarterPackReadonlyClient';
import { builderNftChain, getBuilderNftContractAddressForNftType } from '@packages/scoutgame/builderNfts/constants';
import { uniqueNftPurchaseEventKey } from '@packages/scoutgame/builderNfts/getMatchingNFTPurchaseEvent';
import { recordNftMint } from '@packages/scoutgame/builderNfts/recordNftMint';
import { recordNftTransfer } from '@packages/scoutgame/builderNfts/recordNftTransfer';
import { recordOnchainNftMint } from '@packages/scoutgame/builderNfts/recordOnchainNftMint';
import { convertCostToPoints } from '@packages/scoutgame/builderNfts/utils';
import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { isOnchainPlatform } from '@packages/utils/platform';
import { prefix0x } from '@packages/utils/prefix0x';
import type { Address } from 'viem';

export async function findAndIndexMissingPurchases({
  nftType,
  season = getCurrentSeasonStart()
}: {
  nftType: BuilderNftType;
  season?: ISOWeek;
}) {
  const weekBeforeSeason = getPreviousWeek(season);

  const startBlockNumber = await getLastBlockOfWeek({ week: weekBeforeSeason, chainId: builderNftChain.id });

  const contractAddress = getBuilderNftContractAddressForNftType({ nftType, season });

  const transferSingleEvents = await getTransferSingleWithBatchMerged({
    fromBlock: startBlockNumber,
    contractAddress,
    chainId: builderNftChain.id
  });
  const transferSingleEventsMapped = transferSingleEvents.reduce(
    (acc, val) => {
      acc[uniqueNftPurchaseEventKey(val)] = val;

      return acc;
    },
    {} as Record<string, TransferSingleEvent>
  );

  const missingEvents: typeof transferSingleEvents = [];

  const uniqueStoredTransactions = await prisma.nFTPurchaseEvent
    .findMany({
      where: {
        builderNft: {
          contractAddress,
          season
        }
      },
      select: {
        txHash: true,
        txLogIndex: true,
        senderWalletAddress: true,
        walletAddress: true,
        tokensPurchased: true,
        id: true,
        builderNft: {
          select: {
            tokenId: true
          }
        }
      }
    })
    .then((transactions) =>
      transactions.reduce(
        (acc, tx) => {
          acc[
            uniqueNftPurchaseEventKey({
              args: {
                from: tx.senderWalletAddress as Address | null,
                to: tx.walletAddress as Address | null,
                id: BigInt(tx.builderNft.tokenId),
                value: BigInt(tx.tokensPurchased)
              },
              transactionHash: prefix0x(tx.txHash),
              logIndex: tx.txLogIndex as number
            })
          ] = tx;
          return acc;
        },
        {} as Record<string, (typeof transactions)[number]>
      )
    );

  for (const event of transferSingleEvents) {
    if (!uniqueStoredTransactions[uniqueNftPurchaseEventKey(event)]) {
      missingEvents.push(event);
    }
  }

  // Early exit
  if (!missingEvents.length) {
    scoutgameMintsLogger.info(`No missing events found for ${nftType} nfts in season ${season}`);
    return;
  }

  scoutgameMintsLogger.info(`Found ${missingEvents.length} missing events for ${nftType} nfts in season ${season}`);

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
    for (const missingTx of groupedByTokenId[Number(key)].records) {
      const matchingNft = nfts.find((nft) => nft.tokenId === Number(key));

      try {
        scoutgameMintsLogger.info('Missing tx', missingTx.transactionHash, 'tokenId', key);

        if (!matchingNft) {
          scoutgameMintsLogger.error(`NFT with tokenId ${key} not found`);
          // eslint-disable-next-line no-continue
          continue;
        }

        // Null to means this is a burn, which impacts the total supply. Not null from means this is a transfer from an existing wallet
        if (missingTx.args.to === NULL_EVM_ADDRESS || missingTx.args.from !== NULL_EVM_ADDRESS) {
          scoutgameMintsLogger.info('Detected secondary market transfer', missingTx.transactionHash, 'tokenId', key);
          await recordNftTransfer({
            contractAddress,
            transferSingleEvent: missingTx
          });
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
          : getBuilderNftContractReadonlyClient().getTokenPurchasePrice({
              args: { tokenId: BigInt(key), amount: BigInt(missingTx.args.value) },
              blockNumber: missingTx.blockNumber
            }));

        const asPoints = isOnchainPlatform()
          ? Number(price / BigInt(10 ** devTokenDecimals))
          : convertCostToPoints(price);

        const singleEvent = transferSingleEventsMapped[uniqueNftPurchaseEventKey(missingTx)];

        const address = singleEvent.args.to;

        if (!address) {
          scoutgameMintsLogger.error(`Tx ${missingTx.transactionHash} has no recipient address`);
        }

        if (isOnchainPlatform()) {
          const _sentAt = await getPublicClient(builderNftChain.id)
            .getBlock({
              blockNumber: singleEvent.blockNumber
            })
            .then((block) => Number(block.timestamp) * 1000);

          const scout = await prisma.scoutWallet.findUniqueOrThrow({
            where: {
              address: singleEvent.args.to.toLowerCase() as `0x${string}`
            },
            select: {
              scoutId: true
            }
          });

          await recordOnchainNftMint({
            amount: Number(singleEvent.args.value),
            pointsValue: asPoints,
            builderNftId: matchingNft.id,
            recipientAddress: address.toLowerCase() as Address,
            txHash: missingTx.transactionHash,
            txLogIndex: missingTx.logIndex,
            scoutId: scout.scoutId,
            sentAt: new Date(_sentAt)
          });
        } else {
          await recordNftMint({
            amount: Number(missingTx.args.value),
            mintTxHash: missingTx.transactionHash,
            paidWithPoints: false,
            pointsValue: asPoints,
            builderNftId: matchingNft.id,
            recipientAddress: address,
            mintTxLogIndex: missingTx.logIndex
          });
        }

        scoutgameMintsLogger.info('Resolved missing purchase', {
          missingTxHash: missingTx.transactionHash,
          matchingNftId: matchingNft?.id,
          nftType,
          season
        });
      } catch (error) {
        scoutgameMintsLogger.error('Error resolving missing purchase', {
          error,
          missingTxHash: missingTx.transactionHash
        });
      }
    }
  }
}
