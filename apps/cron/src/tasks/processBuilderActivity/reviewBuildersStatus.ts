import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';

import { getBuilderActivity } from './getBuilderActivity';

/**
 * Review builders status and update it if they had activity in the last 28 days in our repos
 */
export async function reviewBuildersStatus() {
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
    const githubUser = builder.githubUsers.at(0);

    if (githubUser?.login) {
      // Get the activity of the builder in the last 28 days
      const { commits, pullRequests } = await getBuilderActivity({
        login: githubUser.login,
        githubUserId: githubUser.id,
        after: last28Days
      });

      // If the builder has activity in the last 28 days approve it
      if (commits.length > 0 || pullRequests.length > 0) {
        await prisma.scout.update({
          where: {
            id: builder.id
          },
          data: {
            builderStatus: 'approved'
          }
        });
        // If the builder has no activity in the last 28 days reject it
      } else if (builder.createdAt < last28Days) {
        await prisma.scout.update({
          where: {
            id: builder.id
          },
          data: {
            builderStatus: 'rejected'
          }
        });
      }
    }
  }
}
