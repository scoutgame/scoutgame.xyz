import { processAllBuilderActivity } from '../apps/cron/src/tasks/processBuilderActivity';
import { processBuilderActivity } from '../apps/cron/src/tasks/processBuilderActivity/processBuilderActivity';
import { getBuilderActivity } from '../apps/cron/src/tasks/processBuilderActivity/getBuilderActivity';
import { DateTime } from 'luxon';
import { getCurrentWeek, getWeekFromDate, getCurrentSeasonStart } from '@packages/dates/utils';
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
  const newApproved = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved',
      createdAt: {
        gt: DateTime.fromISO('2025-01-20', { zone: 'utc' }).toJSDate()
      }
    },
    include: { githubUsers: true }
  });
  console.log('Found', newApproved.length, 'newly approved builders');
  for (const builder of newApproved) {
    // const builder = await prisma.scout.findFirstOrThrow({
    //   where: { path: 'zod' },
    //   include: { githubUsers: true }
    // });

    // await resetBuilderEvents(builder.id, builder.githubUsers[0]!);

    // const events = await getSavedBuilderEvents(builder.id, '2025-W07');
    // prettyPrint(events);

    // return;
    console.log('Getting builder activity for ' + builder.displayName);

    const { commits, pullRequests } = await getBuilderActivity({
      login: builder.githubUsers[0].login,
      githubUserId: builder.githubUsers[0]?.id,
      after: DateTime.fromISO('2025-02-10', { zone: 'utc' }).toJSDate()
    });
    if (commits.length > 0) {
      console.log('Found Commits', commits.length);
    }
    //prettyPrint(commits);
    for (const commit of commits) {
      const date = new Date(commit.commit.committer!.date!);
      console.log(commit.repository.full_name, date.toISOString().split('T')[0], getWeekFromDate(date));
      //console.log(builder.displayName + '\t' + builder.email + '\t' + commit.repository.full_name +'\t' +  new Date(commit.commit.committer!.date!).toDateString());
    }
    const mergedPullRequests = pullRequests.filter((pr) => pr.mergedAt);
    if (mergedPullRequests.length > 0) {
      console.log('Found Pull Requests', mergedPullRequests.length);
    }
    // prettyPrint(pullRequests);
    for (const pr of mergedPullRequests) {
      const date = new Date(pr.mergedAt!);
      console.log('week', getWeekFromDate(date));
      console.log(
        [
          builder.displayName,
          'https://scoutgame.xyz/u/' + builder.path,
          builder.email,
          pr.repository.nameWithOwner,
          date.toDateString(),
          pr.url
        ].join('\t')
      );
    }
  }
})();
