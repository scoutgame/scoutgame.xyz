import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { NULL_EVM_ADDRESS } from '@charmverse/core/protocol';
import { getLastBlockOfWeek } from '@packages/blockchain/getLastBlockOfWeek';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart, getPreviousWeek } from '@packages/dates/utils';
import { getRevertedMintTransactionAttestations } from '@packages/safetransactions/getRevertedMintTransactionAttestations';
import type { TransferSingleEvent } from '@packages/scoutgame/builderNfts/accounting/getTransferSingleEvents';
import { getTransferSingleWithBatchMerged } from '@packages/scoutgame/builderNfts/accounting/getTransferSingleWithBatchMerged';
import { getPreSeasonTwoBuilderNftContractReadonlyClient } from '@packages/scoutgame/builderNfts/clients/preseason02/getPreSeasonTwoBuilderNftContractReadonlyClient';
import { getBuilderNftStarterPackReadonlyClient } from '@packages/scoutgame/builderNfts/clients/starterPack/getBuilderContractStarterPackReadonlyClient';
import { builderNftChain, getBuilderNftContractAddressForNftType } from '@packages/scoutgame/builderNfts/constants';
import { recordNftMint } from '@packages/scoutgame/builderNfts/recordNftMint';
import { recordNftTransfer } from '@packages/scoutgame/builderNfts/recordNftTransfer';
import { convertCostToPoints } from '@packages/scoutgame/builderNfts/utils';
import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';
import { findOrCreateWalletUser } from '@packages/users/findOrCreateWalletUser';
import { prefix0x } from '@packages/utils/prefix0x';

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

  const transactionInfoAttestations = await getRevertedMintTransactionAttestations();

  function uniqueKey(event: Pick<TransferSingleEvent, 'args' | 'transactionHash' | 'logIndex'>) {
    return `${event.args.id}-${event.args.value}-${event.args.from}-${event.args.to}-${event.transactionHash}-${event.logIndex}`;
  }

  const transferSingleEvents = await getTransferSingleWithBatchMerged({
    fromBlock: startBlockNumber,
    contractAddress,
    chainId: builderNftChain.id
  }).then((events) =>
    events.filter(
      // Ignore an event if we burned the corresponding NFT
      (event) =>
        !transactionInfoAttestations.some((attestation) => attestation.transactionHashesMap[event.transactionHash])
    )
  );
  const transferSingleEventsMapped = transferSingleEvents.reduce(
    (acc, val) => {
      acc[uniqueKey(val)] = val;

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
    .then(
      (transactions) =>
        new Map(
          transactions.map((tx) => [
            uniqueKey({
              args: {
                from: (tx.senderWalletAddress ?? NULL_EVM_ADDRESS) as `0x${string}`,
                to: (tx.walletAddress ?? NULL_EVM_ADDRESS) as `0x${string}`,
                id: BigInt(tx.builderNft.tokenId),
                value: BigInt(tx.tokensPurchased),
                operator: (tx.senderWalletAddress ?? NULL_EVM_ADDRESS) as `0x${string}`
              },
              transactionHash: prefix0x(tx.txHash),
              logIndex: tx.txLogIndex as number
            }),
            tx
          ])
        )
    );

  for (const event of transferSingleEvents) {
    if (!uniqueStoredTransactions.has(uniqueKey(event))) {
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

      const matchingNft = nfts.find((nft) => nft.tokenId === Number(key));

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
        recipientAddress: address,
        mintTxLogIndex: missingTx.logIndex
      });
    }
  }
}
