import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { prefix0x } from '@packages/utils/prefix0x';
import { parseEventLogs } from 'viem';
import { proposePreSeason02OrStarterPackBurnTransactions } from '@packages/scoutgame/builderNfts/proposeBurnTransaction';
import type { ProposedBurnParams } from '@packages/scoutgame/builderNfts/proposeBurnTransaction';
import { transferSingleAbi } from '@packages/scoutgame/builderNfts/accounting/getTransferSingleEvents';
import { optimism } from 'viem/chains';

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
      txHash: true,
      scoutId: true,
      paidInPoints: true,
      builderNft: {
        select: {
          season: true,
          nftType: true
        }
      }
    }
  });

  const missingTxHashes = transactionHashes.filter((txHash) => !nftPurchaseEvents.some((event) => event.txHash === txHash));

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


  const publicClient = getPublicClient(chainId);

  const burnTransactions: ProposedBurnParams[] = [];

  for (let i = 0; i < nftPurchaseEvents.length; i++) {
    const nftPurchaseEvent = nftPurchaseEvents[i];

    log.info(`Validating transaction ${i + 1} of ${nftPurchaseEvents.length}`);

    const { txHash, builderNft } = nftPurchaseEvent;
    const receipt = await publicClient.getTransactionReceipt({
      hash: prefix0x(txHash)
    });

    const parsedLogs = parseEventLogs({
      abi: [transferSingleAbi],
      logs: receipt.logs,
      eventName: 'TransferSingle'
    });

    if (!parsedLogs.length) {
      throw new Error(`No TransferSingle event found in transaction ${txHash}`);
    }

    const parsedLog = parsedLogs[0];

    log.info(`Found TransferSingle event in transaction ${txHash}`, {
      tokenId: parsedLog.args.id,
      amount: parsedLog.args.value,
      recipient: parsedLog.args.to
    });

    burnTransactions.push({
      holderAddress: parsedLog.args.to,
      tokenId: Number(parsedLog.args.id),
      amount: Number(parsedLog.args.value),
      nftType: builderNft.nftType,
      scoutId: builderNft.nftType === 'starter_pack' ? nftPurchaseEvent.scoutId : undefined
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



revertFraudulentMintTransactions({
  transactionHashes: [
    // Insert transaction hashes here
  ],
  chainId: optimism.id,
  season: '2025-W02'
});
