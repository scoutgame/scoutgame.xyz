import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getBlockByDate } from '@packages/blockchain/getBlockByDate';
// console.log('current week', getCurrentWeek());
import { retrieveWalletTransactions } from '../apps/cron/src/tasks/processBuilderOnchainActivity/retrieveWalletTransactions';
async function query() {
  const chainId = 167000;
  const client = getPublicClient(chainId);
  const windowStart = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);

  const fromBlock = await getBlockByDate({ date: windowStart, chainId });
  const latestBlock = await client.getBlockNumber();
  const scout = await retrieveWalletTransactions({
    contractId: '',
    address: '0x8de1988806ae4693e0fc6bc99f8f711ed9566503',
    chainId,
    fromBlock: fromBlock.number,
    toBlock: latestBlock
  });
  // const scout = await prisma.scout.findFirst({
  //   where: { farcasterId: 420564 }
  //   // include: {
  //   //   partnerRewardEvents: {
  //   //     orderBy: {
  //   //       week: 'desc'
  //   //     }
  //   //   }
  //   // }
  //   // include: {
  //   //   nftPurchaseEvents: {
  //   //     select: {
  //   //       pointsValue: true,
  //   //       tokensPurchased: true,
  //   //       builderNFT: {
  //   //         select: {
  //   //           builder: {
  //   //             select: {
  //   //               displayName: true,
  //   //               path: true
  //   //             }
  //   //           }
  //   //         }
  //   //       }
  //   //     }
  //   //   }
  //   // }
  // });
  prettyPrint(scout);
}

query();
