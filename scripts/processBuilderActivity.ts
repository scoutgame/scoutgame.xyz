import { processAllDeveloperActivity } from '../apps/cron/src/tasks/processDeveloperActivity';
import { processDeveloperActivity } from '../apps/cron/src/tasks/processDeveloperActivity/processDeveloperActivity';
import { getUserContributions } from '@packages/github/getUserContributions';
import { DateTime } from 'luxon';
import { getCurrentWeek, getStartOfWeek, getCurrentSeasonStart } from '@packages/dates/utils';
import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';

const windowStart = DateTime.fromISO('2025-03-24', { zone: 'utc' }).toJSDate();

async function resetDeveloperEvents(builderId: string, githubUser: any) {
  await deleteDeveloperEvents(builderId, githubUser.id);
  await processDeveloperActivity({
    builderId: builderId,
    githubUser: githubUser,
    createdAfter: windowStart,
    season: getCurrentSeasonStart()
  });
}

async function resetAllDeveloperEvents(week = getCurrentWeek()) {
  const result = await prisma.$transaction([
    prisma.githubEvent.deleteMany({
      where: {
        createdAt: {
          gt: getStartOfWeek(week).toJSDate()
        }
      }
    }),
    prisma.builderEvent.deleteMany({
      where: {
        week: week,
        type: {
          in: ['merged_pull_request', 'daily_commit']
        }
      }
    })
  ]);
  console.log('Deleted', result[0], 'github events');
  console.log('Deleted', result[1], 'developer events');
  await processAllDeveloperActivity();
}

async function deleteDeveloperEvents(builderId: string, githubUserId: number) {
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

async function getSavedDeveloperEvents(builderId: string, week: string = getCurrentWeek()) {
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
  await resetAllDeveloperEvents();
  console.log('Done!');
  return;

  const newApproved = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved'
    },
    include: { githubUsers: true }
  });
  console.log('Found', newApproved.length, 'approved developer');
  for (const builder of newApproved) {
    // const builder = await prisma.scout.findFirstOrThrow({
    //   where: { path: 'zod' },
    //   include: { githubUsers: true }
    // });

    // await resetDeveloperEvents(builder.id, builder.githubUsers[0]!);

    // const events = await getSavedDeveloperEvents(builder.id, '2025-W07');
    // prettyPrint(events);

    // return;
    console.log('Getting developer activity for ' + builder.displayName);

    const { commits, pullRequests } = await getUserContributions({
      login: builder.githubUsers[0].login,
      githubUserId: builder.githubUsers[0]?.id,
      after: DateTime.fromISO('2025-03-24', { zone: 'utc' }).toJSDate()
    });
    console.log('Found Commits', commits.length, pullRequests.length);

    // //prettyPrint(commits);
    // for (const commit of commits) {
    //   const date = new Date(commit.commit.committer!.date!);
    //   console.log(commit.repository.full_name, date.toISOString().split('T')[0], getWeekFromDate(date));
    //   //console.log(builder.displayName + '\t' + builder.email + '\t' + commit.repository.full_name +'\t' +  new Date(commit.commit.committer!.date!).toDateString());
    // }
    // const mergedPullRequests = pullRequests.filter((pr) => pr.mergedAt);
    // if (mergedPullRequests.length > 0) {
    //   console.log('Found Pull Requests', mergedPullRequests.length);
    // }
    // // prettyPrint(pullRequests);
    // for (const pr of mergedPullRequests) {
    //   const date = new Date(pr.mergedAt!);
    //   console.log('week', getWeekFromDate(date));
    //   console.log(
    //     [
    //       builder.displayName,
    //       'https://scoutgame.xyz/u/' + builder.path,
    //       builder.email,
    //       pr.repository.nameWithOwner,
    //       date.toDateString(),
    //       pr.url
    //     ].join('\t')
    //   );
    // }
  }
})();
