import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getBlockByDate } from '@packages/blockchain/getBlockByDate';
// console.log('current week', getCurrentWeek());

async function query() {
  // write a query to return all the bonus partners from the github repo table
  const events = await prisma.githubEvent.findMany({
    where: {
      type: 'merged_pull_request',
      createdAt: {
        gt: new Date('2025-02-12T00:00:00Z'),
        lt: new Date('2025-02-23T23:59:59Z')
      },
      builderEvent: {
        bonusPartner: 'celo'
      }
    },
    include: {
      repo: true,
      builderEvent: {
        include: {
          builder: true
        }
      }
    }
  });

  prettyPrint(events);
}

query();
