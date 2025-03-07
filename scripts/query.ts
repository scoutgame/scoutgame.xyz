import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getBlockByDate } from '@packages/blockchain/getBlockByDate';
// console.log('current week', getCurrentWeek());
import { getEvmWalletStats, getSolanaWalletStats } from '@packages/dune/queries';
import { base } from 'viem/chains';

const solanaWallet = '2N4fC9tfRGWxnUWhb4fzp7dTUY1yBSxXVJUEdVUmQUaJ';
const chrisWallet = '0x3B60e31CFC48a9074CD5bEbb26C9EAa77650a43F';
// 0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2
async function query() {
  const events = await getSolanaWalletStats({
    address: solanaWallet,
    startDate: new Date('2025-03-03T00:00:00Z'),
    endDate: new Date('2025-03-05T00:00:00Z')
  });
  // const events = await getEvmWalletStats({
  //   address: chrisWallet,
  //   chainId: base.id,
  //   startDate: new Date('2025-03-03T00:00:00Z'),
  //   endDate: new Date('2025-03-06T00:00:00Z')
  // });
  prettyPrint(events);
}

query();
