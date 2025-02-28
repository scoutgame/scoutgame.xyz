import { processAllBuilderActivity } from '../tasks/processBuilderActivity';
import { processBuilderActivity } from '../tasks/processBuilderActivity/processBuilderActivity';
import { getBuilderActivity } from '../tasks/processBuilderActivity/getBuilderActivity';
import { DateTime } from 'luxon';
import { getCurrentWeek, getCurrentSeasonStart } from '@packages/dates/utils';
import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';

const windowStart = DateTime.fromISO('2024-10-28', { zone: 'utc' }).toJSDate();

async function resetBuilderEvents(builderId: string, githubUser: any) {
  await deleteBuilderEvents(builderId, githubUser.id);
  await processBuilderActivity({
    builderId: builderId,
    githubUser: githubUser,
    createdAfter: windowStart,
    season: getCurrentSeasonStart()
  });
}

async function deleteBuilderEvents(builderId: string, githubUserId: number) {
  const result = await prisma.$transaction([
    prisma.githubEvent.deleteMany({
      where: {
        createdBy: githubUserId,
        createdAt: {
          gt: windowStart
        }
      }
    }),
    prisma.builderEvent.deleteMany({
      where: {
        builderId,
        week: getCurrentWeek(),
        type: {
          in: ['merged_pull_request', 'daily_commit']
        }
      }
    })
  ]);
  console.log('Deleted', result[0], 'github events');
  console.log('Deleted', result[1], 'builder events');
}

async function getSavedBuilderEvents(builderId: string, week: string = getCurrentWeek()) {
  return prisma.builderEvent.findMany({
    where: {
      builderId: builderId,
      week: week
    },
    include: {
      gemsReceipt: true
    }
  });
}

(async () => {

  const builder = await prisma.scout.findFirstOrThrow({
    where: { path: 'zod' },
    include: { githubUsers: true }
  });

  // await resetBuilderEvents(builder.id, builder.githubUsers[0]!);

  // const events = await getSavedBuilderEvents(builder.id, '2025-W07');
  // prettyPrint(events);

  
  // return;
  console.log('Getting builder activity');

  const { commits, pullRequests } = await getBuilderActivity({
    login: builder.githubUsers[0].login,
    githubUserId: builder.githubUsers[0]?.id,
    after: DateTime.fromISO('2025-02-10', { zone: 'utc' }).toJSDate()
  });
  console.log('Found Commits', commits.length);
  prettyPrint(commits);
  console.log('Found Pull Requests', pullRequests.length);
  prettyPrint(pullRequests);
})();
