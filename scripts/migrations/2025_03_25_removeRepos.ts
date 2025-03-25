import { prisma } from '@charmverse/core/prisma-client';

async function query() {
  const result = await prisma.githubRepo.findMany({
    where: {
      ownerType: 'user',
      deletedAt: null
    },
    select: {
      id: true,
      events: {
        select: {
          builderEvent: {
            select: {
              builderId: true
            }
          }
        }
      }
    }
  });
  console.log(result.length);
  const toDelete = result.filter((repo) => {
    const builderIds = new Set(repo.events.map((event) => event.builderEvent?.builderId));
    return builderIds.size <= 1;
  });
  console.log('marking', toDelete.length, 'repos as deleted');
  // Process repos in batches of 100
  for (let i = 0; i < toDelete.length; i += 100) {
    const batch = toDelete.slice(i, i + 100);
    await prisma.githubRepo.updateMany({
      where: {
        id: {
          in: batch.map((repo) => repo.id)
        }
      },
      data: {
        deletedAt: new Date()
      }
    });
    console.log(`marked ${Math.min(i + 100, toDelete.length)} of ${toDelete.length} repos as deleted`);
  }
}

query();
