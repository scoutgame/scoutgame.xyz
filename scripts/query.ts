import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getBlockByDate } from '@packages/blockchain/getBlockByDate';
// console.log('current week', getCurrentWeek());
import { getEvmAddressStats, getSolanaWalletStats } from '@packages/dune/queries';
import { base, taiko } from 'viem/chains';
import { getWalletTransactionStats } from '@packages/blockchain/analytics/getTransactionStats';

import { recordWalletAnalyticsForWeek } from '@packages/blockchain/analytics/recordWalletAnalytics';
import { getCurrentWeek } from '@packages/dates/utils';
const solanaWallet = '2N4fC9tfRGWxnUWhb4fzp7dTUY1yBSxXVJUEdVUmQUaJ';
const chrisWallet = '0x3B60e31CFC48a9074CD5bEbb26C9EAa77650a43F';
// 0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2
async function query() {
  // const events = await getSolanaWalletStats({
  //   address: solanaWallet,
  //   startDate: new Date('2025-03-03T00:00:00Z'),
  //   endDate: new Date('2025-03-05T00:00:00Z')
  // });
  // const events = await getEvmAddressStats({
  //   address: chrisWallet,
  //   chainId: base.id,
  //   startDate: new Date('2025-03-03T00:00:00Z'),
  //   endDate: new Date('2025-03-06T00:00:00Z')
  // });
  //prettyPrint(events);

  const scoutProjectWallet = await prisma.scoutProjectWallet.findFirstOrThrow({
    where: {
      chainId: taiko.id
    }
  });
  console.log(scoutProjectWallet);
  // return;

  // await prisma.scoutProjectWalletTransaction.createMany({
  //   data: [
  //     {
  //       walletId: scoutProjectWallet!.id,
  //       chainId: base.id,
  //       createdAt: new Date('2025-03-05T00:00:00Z'),
  //       gasCost: 4000,
  //       gasUsed: 6000,
  //       from: '0x0000000000000000000000000000000000000000',
  //       to: '0x0000000000000000000000000000000000000000',
  //       txHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  //       txData: '0x0000000000000000000000000000000000000000000000000000000000000000',
  //       status: '0x0',
  //       blockNumber: 1,
  //       gasPrice: 1000
  //     },
  //     {
  //       walletId: scoutProjectWallet!.id,
  //       chainId: base.id,
  //       createdAt: new Date('2025-03-03T00:00:00Z'),
  //       gasCost: 1000,
  //       gasUsed: 1000,
  //       from: '0x0000000000000000000000000000000000000000',
  //       to: '0x0000000000000000000000000000000000000000',
  //       txHash: '0x0000000000000000000000000000000000000000000000000000000000000001',
  //       txData: '0x0000000000000000000000000000000000000000000000000000000000000000',
  //       status: '0x0',
  //       blockNumber: 1,
  //       gasPrice: 1000
  //     }
  //   ]
  // });
  // const tokens = await prisma.scoutProjectWalletTransaction.count({});

  // // prettyPrint(tokens);
  // await getWalletTransactionStats({
  //   address: scoutProjectWallet.address,
  //   chainId: scoutProjectWallet.chainId!
  // });
  await recordWalletAnalyticsForWeek(scoutProjectWallet, getCurrentWeek());
}

query();
