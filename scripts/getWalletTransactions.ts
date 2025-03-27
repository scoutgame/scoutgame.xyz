import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';
import { getCurrentWeek } from '@packages/dates/utils';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getUsdcTransactions } from '@packages/blockchain/analytics/getUsdcTransactions';
import { getBlockByDate } from '@packages/blockchain/getBlockByDate';
import { getLastBlockOfWeek } from '@packages/blockchain/getLastBlockOfWeek';
import { optimism } from 'viem/chains';
import fs from 'fs';
import { toJson } from '@packages/utils/json';

import transactions from './transactions.json';

async function query() {
  const firstSeason = '2024-W41';
  const secondSeason = '2025-W02';
  const secondSeasonStartDate = DateTime.fromISO(secondSeason).toJSDate().toISOString();
  const firstSeasonStartDate = DateTime.fromISO(firstSeason).toJSDate().toISOString();
  const addresses = new Set<string>();
  let season2 = 0;
  const value = transactions.reduce((acc, tx) => {
    addresses.add(tx.from);
    if (tx.timestamp < firstSeasonStartDate) {
      console.log('tx before first season', tx);
      return acc;
    } else if (tx.timestamp < secondSeasonStartDate) {
      return acc + Number(tx.value);
    } else {
      season2 += Number(tx.value);
      return acc;
    }
  }, 0);

  console.log('txs', transactions.length);
  console.log('addresses', addresses);

  console.log('Sent by 0x3d0438Cf16E6BF871D1F28E18B5BB175762F3F7C: ', 175066338 / 10 ** 6);

  console.log('Total USDC value: ', value / 10 ** 6);
  console.log('Total USDC value season 2: ', season2 / 10 ** 6);

  return;
  const startDate = DateTime.fromISO(firstSeason);
  const startBlock = 126341012n; // (await getBlockByDate({ date: startDate.toJSDate(), chainId: optimism.id })).number;
  const endBlock = 133722985n; // await getLastBlockOfWeek({ week: '2025-W20', chainId: optimism.id });
  const batchSize = BigInt(100_000);

  console.log('Reading blocks from ', startBlock, ' to ', endBlock);

  let allTransactions = [];

  for (let fromBlock = startBlock; fromBlock < endBlock; fromBlock += batchSize) {
    const toBlock = fromBlock + batchSize > endBlock ? endBlock : fromBlock + batchSize;

    console.log(`Querying blocks ${fromBlock} to ${toBlock}...`);

    const batchTransactions = await getUsdcTransactions({
      fromBlock,
      toBlock,
      toAddress: '0x93326D53d1E8EBf0af1Ff1B233c46C67c96e4d8D' // Scoutgame.eth treasury address
    });

    allTransactions = [...allTransactions, ...batchTransactions];
    console.log(`Found ${batchTransactions.length} transactions in this batch. Total: ${allTransactions.length}`);
  }

  const result = allTransactions;
  prettyPrint('Total transactions found: ', result.length);
  // write to file
  fs.writeFileSync('transactions.json', toJson(result));

  // const events = await prisma.nFTPurchaseEvent.findMany({
  //   where: {
  //     paidInPoints: false,
  //     scoutWallet: {
  //       scout: {
  //         deletedAt: null
  //       }
  //     }
  //   },
  //   select: {
  //     builderNft: {
  //       select: {
  //         season: true
  //       }
  //     },
  //     pointsValue: true
  //   }
  // });
  // // Group events by season and calculate total points value per season
  // const pointsValueBySeasons = events.reduce<Record<string, number>>((acc, event) => {
  //   const season = event.builderNft?.season || 'unknown';
  //   if (!acc[season]) {
  //     acc[season] = 0;
  //   }
  //   acc[season] += event.pointsValue || 0;
  //   return acc;
  // }, {});
  // console.log('Found events', events.length);
  // console.log('Total points value per season:');
  // prettyPrint(pointsValueBySeasons);
  // // Calculate grand total across all seasons
  // const totalPointsValue = Object.values(pointsValueBySeasons).reduce((sum, value) => sum + value, 0);
  // console.log(`Grand total points value: ${totalPointsValue}`);
  // // prettyPrint(events);
}

query();
