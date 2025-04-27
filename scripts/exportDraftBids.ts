import { prisma } from '@charmverse/core/prisma-client';
import { handlePendingDraftTransaction } from '@packages/scoutgame/builderNfts/handlePendingDraftTransaction';
const season = '2025-W17';

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { formatUnits } from 'viem';
import { DRAFT_BID_RECIPIENT_ADDRESS } from '@packages/blockchain/constants';

/**
 * Reads and filters token transfers from a CSV file, exported from basescan
 * @param filePath Path to the CSV file
 * @param tokenNameFilter Optional token name to filter by
 * @returns Array of filtered token transfer records
 */
function readTokenTransfers(filePath: string, tokenNameFilter?: string, tokenSymbol?: string): any[] {
  try {
    // Read the CSV file
    const fileContent = fs.readFileSync(path.resolve(filePath), 'utf8');

    // Parse the CSV content
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    records.forEach((record: any) => {
      record['TokenValue'] = record['TokenValue'].replace(/,/g, '');
    });
    // console.log(records.slice(0, 4));
    // Filter records if tokenNameFilter is provided
    if (tokenNameFilter) {
      return records.filter(
        (record: any) =>
          record.TokenName === tokenNameFilter &&
          record.TokenSymbol === tokenSymbol &&
          record.To === DRAFT_BID_RECIPIENT_ADDRESS
      );
    }

    return records;
  } catch (error) {
    console.error('Error reading or parsing token transfers file:', error);
    return [];
  }
}

// Example usage:

async function exportMissingBids() {
  const onchainTransfers = readTokenTransfers('token-transfers.csv', 'ERC-20: Scout Protocol Token', 'DEV');
  console.log(`Found ${onchainTransfers.length} DEV token transfers`);
  const totalDev = onchainTransfers.reduce((acc, transfer) => acc + parseInt(transfer['TokenValue']), 0);
  console.log(`Total DEV from onchain: ${totalDev}`);

  const databaseBids = await prisma.draftSeasonOffer.findMany({
    where: { season, status: 'success' },
    orderBy: {
      createdAt: 'desc'
    }
  });
  console.log('Found', databaseBids.length, 'bids in the database');

  const transfersMissingBids = onchainTransfers.filter(
    (transfer) =>
      !databaseBids.some(
        (bid) =>
          bid.txHash?.toLowerCase() === transfer['Transaction Hash'].toLowerCase() ||
          bid.decentTxHash?.toLowerCase() === transfer['Transaction Hash'].toLowerCase()
      )
  );

  // Calculate total DEV tokens from missing transactions
  const totalMissingDev = transfersMissingBids.reduce((acc, transfer) => acc + parseInt(transfer['TokenValue']), 0);
  console.log(`Total DEV from ${transfersMissingBids.length} transactions missing bids: ${totalMissingDev}`);

  const walletsMissingBids = transfersMissingBids.reduce(
    (acc, transfer) => {
      const walletAddress = transfer['From'].toLowerCase();
      acc[walletAddress] = (acc[walletAddress] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log('Number of wallets with missing bids:', Object.keys(walletsMissingBids).length);

  const rows = await Promise.all(
    transfersMissingBids.map(async (transfer) => {
      const walletAddress = transfer['From'].toLowerCase();
      const scout = await prisma.scout.findFirstOrThrow({
        where: {
          wallets: {
            some: {
              address: walletAddress
            }
          }
        }
      });
      return {
        scoutId: scout.id,
        displayName: scout.displayName,
        scoutFarcaster: scout.farcasterName,
        scoutTelegram: scout.telegramName,
        // totalBids: transfersWithBids.filter((t) => t['From'].toLowerCase() === walletAddress).length,
        email: scout.email,
        walletAddress,
        transferHash: transfer['Transaction Hash'],
        amount: transfer['TokenValue']
      };
    })
  );
  // Export rows to CSV
  const csvContent = [
    // CSV header
    [
      'Scout ID',
      'Display Name',
      // 'Total Bids',
      'Farcaster',
      'Telegram',
      'Email',
      'Wallet Address',
      'Transaction Hash',
      'Amount'
    ].join(','),
    // CSV data rows
    ...rows
      .sort((a, b) => (a.scoutId > b.scoutId ? 1 : -1))
      .map((row) =>
        [
          row.scoutId,
          row.displayName,
          // row.totalBids,
          row.scoutFarcaster || '',
          row.scoutTelegram || '',
          row.email || '',
          row.walletAddress,
          row.transferHash,
          row.amount
        ].join(',')
      )
  ].join('\n');

  const outputPath = './missing-bids-export.csv';
  fs.writeFileSync(outputPath, csvContent);
  console.log(`CSV exported to: ${outputPath}`);
  console.log(`Total rows exported: ${rows.length}`);
}

async function exportDraftBids() {
  const databaseBids = await prisma.draftSeasonOffer.findMany({
    where: { season, status: 'success' },
    orderBy: {
      createdAt: 'desc'
    }
  });
  console.log('Found', databaseBids.length, 'bids in the database');

  const uniqueUsers = [...new Set(databaseBids.map((bid) => bid.makerWalletAddress))];
  // Count bids per user
  const bidsPerUser = databaseBids.reduce(
    (acc, bid) => {
      const walletAddress = bid.makerWalletAddress;
      acc[walletAddress] = (acc[walletAddress] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log('Number of unique users:', uniqueUsers.length);

  // Calculate statistics
  const bidCounts = Object.values(bidsPerUser);
  const maxBids = Math.max(...bidCounts);
  const minBids = Math.min(...bidCounts);
  const avgBids = bidCounts.reduce((sum, count) => sum + count, 0) / bidCounts.length;

  console.log(`\nBid statistics:`);
  console.log(`Max bids per user: ${maxBids}`);
  console.log(`Min bids per user: ${minBids}`);
  console.log(`Average bids per user: ${avgBids.toFixed(2)}`);

  // Calculate the total value of all season offers
  const totalValue = databaseBids.reduce((sum, bid) => {
    // Parse the value as a BigInt to handle large numbers accurately
    const bidValue = BigInt(bid.value);
    return sum + bidValue;
  }, BigInt(0));

  console.log(`Total value of all bids: ${formatUnits(totalValue, 18)} DEV`);
  // Generate a CSV of winners (top 50 bids per developer)
  console.log('\nGenerating winners...');

  // Group bids by developer
  const bidsByDeveloper = databaseBids.reduce(
    (acc, bid) => {
      if (!acc[bid.developerId]) {
        acc[bid.developerId] = [];
      }
      acc[bid.developerId].push(bid);
      return acc;
    },
    {} as Record<string, typeof databaseBids>
  );

  // For each developer, get the top 50 bids
  const winners: {
    developerId: string;
    scoutId: string;
    amount: string;
    displayName: string;
    email: string;
    farcaster: string;
    telegram: string;
    walletAddress: string;
  }[] = [];

  const losers: {
    developerId: string;
    scoutId: string;
    amount: string;
    displayName: string;
    email: string;
    farcaster: string;
    telegram: string;
    walletAddress: string;
  }[] = [];

  const devPayouts: {
    developerId: string;
    amount: string;
    displayName: string;
    email: string | null;
    farcaster: string | null;
    telegram: string | null;
    walletAddress: string;
  }[] = [];

  for (const [developerId, bids] of Object.entries(bidsByDeveloper)) {
    // Sort bids by value in descending order
    shuffleArray(bids); // shuffle the bids so that the lower bids are randomly distributed
    const sortedBids = bids.sort((a, b) => {
      const valueA = BigInt(a.value);
      const valueB = BigInt(b.value);
      return valueB > valueA ? 1 : valueB < valueA ? -1 : 0;
    });

    // Take the top 50 bids
    const cutoff = 50;
    const devShare = 0.2;
    const totalBidAmount = sortedBids.slice(0, cutoff).reduce((sum, bid) => sum + BigInt(bid.value), BigInt(0));
    const totalBidTokens = parseInt(formatUnits(totalBidAmount, 18));
    const developer = await prisma.scout.findFirstOrThrow({
      where: {
        id: developerId
      },
      select: {
        id: true,
        displayName: true,
        farcasterName: true,
        email: true,
        telegramName: true,
        wallets: {
          select: {
            address: true
          },
          where: {
            primary: true
          }
        }
      }
    });
    const devPayout = {
      developerId,
      amount: Math.ceil(totalBidTokens * devShare).toString(),
      displayName: developer.displayName,
      email: developer.email,
      farcaster: developer.farcasterName,
      telegram: developer.telegramName,
      walletAddress: developer.wallets[0].address
    };
    devPayouts.push(devPayout);
    // console.log(`Dev ${developer.displayName} receives ${devPayout.amount} from ${totalBidTokens} DEV`);

    // Get scout information for each winning bid
    await Promise.all(
      sortedBids.map(async (bid, index) => {
        const scout = await prisma.scout.findFirstOrThrow({
          where: {
            wallets: {
              some: {
                address: bid.makerWalletAddress.toLowerCase()
              }
            }
          },
          select: {
            id: true,
            displayName: true,
            farcasterName: true,
            email: true,
            telegramName: true
          }
        });
        const row = {
          developerId: bid.developerId,
          scoutId: scout.id,
          amount: formatUnits(BigInt(bid.value), 18),
          displayName: scout.displayName || 'Unknown',
          email: scout.email || 'Unknown',
          farcaster: scout.farcasterName || '',
          telegram: scout.telegramName || '',
          walletAddress: bid.makerWalletAddress
        };

        if (index < cutoff) {
          // mark it as completed so we know it was a winner
          // await prisma.draftSeasonOffer.update({
          //   where: {
          //     id: bid.id
          //   },
          //   data: {
          //     completedAt: new Date()
          //   }
          // });
          winners.push(row);
        } else {
          losers.push(row);
        }
      })
    );
  }

  console.log(`Found ${winners.length} winners across all developers`);
  console.log(`Found ${losers.length} losers`);

  // Generate CSV content
  const csvHeaders = [
    'developerId',
    'scoutId',
    'amount',
    'displayName',
    'email',
    'farcaster',
    'telegram',
    'walletAddress'
  ];
  const winnersCsvContent = [
    csvHeaders.join(','),
    ...winners.map((winner) =>
      [
        winner.developerId,
        winner.scoutId,
        winner.amount,
        `"${winner.displayName.replace(/"/g, '""')}"`,
        winner.email,
        winner.farcaster,
        winner.telegram,
        winner.walletAddress
      ].join(',')
    )
  ].join('\n');
  const losersCsvContent = [
    csvHeaders.join(','),
    ...winners.map((winner) =>
      [
        winner.developerId,
        winner.scoutId,
        winner.amount,
        `"${winner.displayName.replace(/"/g, '""')}"`,
        winner.email,
        winner.farcaster,
        winner.telegram,
        winner.walletAddress
      ].join(',')
    )
  ].join('\n');

  const winnersOutputPath = './draft-winners.csv';
  fs.writeFileSync(winnersOutputPath, winnersCsvContent);
  console.log(`Winners CSV exported to: ${winnersOutputPath}`);
  fs.writeFileSync('./draft-winners.json', JSON.stringify(winners, null, 2));
  console.log(`Winners JSON exported to: ./draft-winners.json`);

  const losersOutputPath = './draft-losers.csv';
  fs.writeFileSync(losersOutputPath, losersCsvContent);
  console.log(`Losers CSV exported to: ${losersOutputPath}`);
  fs.writeFileSync('./draft-losers.json', JSON.stringify(losers, null, 2));
  console.log(`Losers JSON exported to: ./draft-losers.json`);

  fs.writeFileSync('./draft-payout.json', JSON.stringify(devPayouts, null, 2));
  console.log(`Losers JSON exported to: ./dev-payout.json`);
}

// source: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

exportDraftBids();
