import { prisma } from '@charmverse/core/prisma-client';
import { getUserContributions } from '@packages/github/getUserContributions';
import { approveBuilder } from '@packages/scoutgame/builders/approveBuilder';
import { DateTime } from 'luxon';

import { log } from './logger';
/**
 * Review builders status and update it if they had activity in the last 28 days in our repos
 */
export async function approveDevelopers() {
  const last28Days = DateTime.utc().minus({ days: 28 }).toJSDate();

  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: 'applied'
    },
    include: {
      githubUsers: true
    }
  });

  for (const builder of builders) {
    try {
      const githubUser = builder.githubUsers.at(0);

      if (githubUser?.login) {
        // Get the activity of the builder in the last 28 days
        const { commits, pullRequests } = await getUserContributions({
          login: githubUser.login,
          githubUserId: githubUser.id,
          after: last28Days
        });

        const mergedPullRequests = pullRequests.filter((pr) => pr.mergedAt);
        const applicationDate = builder.reappliedAt || builder.createdAt;

        // If the builder has activity in the last 28 days approve it
        if (commits.length > 0 || mergedPullRequests.length > 0) {
          await approveBuilder({ builderId: builder.id });
          log.info('Builder approved due to activity', {
            commits: commits.map((c) => `${c.repository.full_name} - ${c.sha}`),
            pullRequests: mergedPullRequests.map((pr) => `${pr.repository.nameWithOwner} - PR# ${pr.number}`),
            userId: builder.id
          });
          // If the builder has no activity in the last 28 days reject it
        } else if (applicationDate < last28Days) {
          await prisma.scout.update({
            where: {
              id: builder.id
            },
            data: {
              builderStatus: 'rejected'
            }
          });

          log.info('Builder rejected after 28 days of no activity', { applicationDate, userId: builder.id });
        }
      }
    } catch (error) {
      log.error('Error approving builder', { error, userId: builder.id });
    }
  }
}
