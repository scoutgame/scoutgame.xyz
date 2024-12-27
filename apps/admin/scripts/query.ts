import { GET } from '../app/api/partners/moxie/route';
import { getLastWeek } from '@packages/scoutgame/dates';
import { prisma } from '@charmverse/core/prisma-client';
async function query() {
  console.log(
    await prisma.partnerRewardEvent.findMany({
      where: {
        user: {
          path: 'watchcoin'
        }
      },
      select: {
        createdAt: true,
        reward: true,
        week: true,
        user: {
          select: {
            farcasterId: true,
            farcasterName: true,
            path: true
          }
        }
      }
    })
  );
  // await GET('2024-W49');
  // await GET('2024-W50');
  // await GET('2024-W51');
}

query();
