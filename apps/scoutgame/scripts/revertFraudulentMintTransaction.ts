import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getTransferSingleWithBatchMerged } from '@packages/scoutgame/builderNfts/accounting/getTransferSingleWithBatchMerged';
import { getNFTContractAddress, getStarterNFTContractAddress } from '@packages/scoutgame/builderNfts/constants';
import type { ProposedBurnParams } from '@packages/safetransactions/proposeBurnTransaction';
import { proposePreSeason02OrStarterPackBurnTransactions } from '@packages/safetransactions/proposeBurnTransaction';
import { prefix0x } from '@packages/utils/prefix0x';
const gnosisSafeAddress = process.env.SCOUTGAME_GNOSIS_SAFE_ADDRESS as `0x${string}`;

export async function revertFraudulentMintTransactions({
  transactionHashes,
  chainId,
  season
}: {
  transactionHashes: string[];
  chainId: number;
  season: string;
}) {
  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      txHash: {
        in: transactionHashes
      }
    },
    select: {
      createdAt: true,
      txHash: true,
      scoutWallet: {
        select: {
          scoutId: true
        }
      },
      paidInPoints: true,
      builderNft: {
        select: {
          season: true,
          tokenId: true,
          nftType: true
        }
      }
    }
  });

  const missingTxHashes = transactionHashes.filter(
    (txHash) => !nftPurchaseEvents.some((event) => event.txHash === txHash)
  );

  if (missingTxHashes.length > 0) {
    log.warn(`Missing ${missingTxHashes.length} transactions in the database`, { missingTxHashes });
    return;
  }

  const notPaidInPoints = nftPurchaseEvents.filter((event) => !event.paidInPoints);

  if (notPaidInPoints.length > 0) {
    log.warn('Found some transactions that were not paid in points', { notPaidInPoints });
    return;
  }

  const badSeason = nftPurchaseEvents.filter((event) => event.builderNft.season !== season);

  if (badSeason.length > 0) {
    log.warn('Found some transactions that have a mismatching season', { badSeason });
    return;
  }

  const firstMatchingBlockTimestamp = nftPurchaseEvents.reduce(
    (acc: { txHash: string; lowestCreatedAt: number }, event) => {
      const blockTimestamp = event.createdAt.getTime();

      if (!acc.txHash || !acc.lowestCreatedAt) {
        return { txHash: event.txHash, lowestCreatedAt: event.createdAt.getTime() };
      } else if (blockTimestamp < acc.lowestCreatedAt) {
        return { txHash: event.txHash, lowestCreatedAt: blockTimestamp };
      } else {
        return acc;
      }
    },
    { txHash: '', lowestCreatedAt: 0 }
  );

  const blockReceipt = await getPublicClient(chainId).getTransactionReceipt({
    hash: prefix0x(firstMatchingBlockTimestamp.txHash)
  });

  const blockNumber = blockReceipt!.blockNumber;

  const defaultNftTransferSingleEvents = await getTransferSingleWithBatchMerged({
    chainId,
    fromBlock: blockNumber,
    contractAddress: getNFTContractAddress('2025-W02')!
  });

  const starterPackTransferSingleEvents = await getTransferSingleWithBatchMerged({
    chainId,
    fromBlock: blockNumber,
    contractAddress: getStarterNFTContractAddress('2025-W02')!
  });

  const burnTransactions: ProposedBurnParams[] = [];

  for (let i = 0; i < nftPurchaseEvents.length; i++) {
    const nftPurchaseEvent = nftPurchaseEvents[i];

    log.info(`Validating transaction ${i + 1} of ${nftPurchaseEvents.length}`);

    const { txHash, builderNft } = nftPurchaseEvent;

    const transferSingleEvents =
      builderNft.nftType === 'default' ? defaultNftTransferSingleEvents : starterPackTransferSingleEvents;

    const transferSingleEvent = transferSingleEvents.find((event) => event.transactionHash === txHash);

    if (!transferSingleEvent) {
      throw new Error(`No TransferSingle event found for transaction ${txHash}`);
    }

    log.info(`Found TransferSingle event in transaction ${txHash}`, {
      tokenId: transferSingleEvent.args.id,
      amount: transferSingleEvent.args.value,
      recipient: transferSingleEvent.args.to
    });

    burnTransactions.push({
      holderAddress: transferSingleEvent.args.to,
      tokenId: Number(transferSingleEvent.args.id),
      amount: Number(transferSingleEvent.args.value),
      nftType: builderNft.nftType,
      revertedTransactionHash: txHash,
      scoutId: builderNft.nftType === 'starter_pack' ? nftPurchaseEvent.scoutWallet?.scoutId : undefined
    });
  }

  await proposePreSeason02OrStarterPackBurnTransactions({
    chainId,
    burnTransactions,
    safeAddress: gnosisSafeAddress
  });

  log.info(
    `Proposed revert of fraudulent mint transactions. A total of ${burnTransactions.reduce(
      (acc, t) => acc + t.amount,
      0
    )} nfts will be burned.`
  );

  log.warn('Please delete the transactions from the database once they have been reverted.');
}
