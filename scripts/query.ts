import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getBlockByDate } from '@packages/blockchain/getBlockByDate';
// console.log('current week', getCurrentWeek());

async function query() {
  // write a query to return all the bonus partners from the github repo table
  const bonusPartners = await prisma.partnerRewardPayoutContract.findMany({
    select: {
      partner: true
    },
    distinct: ['partner']
  });

  console.log(
    'Unique bonus partners:',
    bonusPartners.map((p) => p.partner)
  );
}

query();
