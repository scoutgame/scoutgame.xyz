import { getLogger } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { Season } from '@packages/dates/config';
import { getCurrentWeek, getCurrentSeasonStart, getDateFromISOWeek } from '@packages/dates/utils';
import { refreshEstimatedPayouts } from '@packages/scoutgame/builderNfts/refreshEstimatedPayouts';
import { updateBuildersRank } from '@packages/scoutgame/builders/updateBuildersRank';
import { refreshBuilderLevels } from '@packages/scoutgame/points/refreshBuilderLevels';
import type Koa from 'koa';

import { processBuilderActivity } from './processBuilderActivity';
import { reviewAppliedBuilders } from './reviewAppliedBuilders';

type ProcessPullRequestsOptions = {
  createdAfter?: Date;
  season?: Season;
};

const log = getLogger('cron-process-builder-activity');

export async function processAllBuilderActivity(
  ctx: Koa.Context | null,
  {
    createdAfter = new Date(Date.now() - 30 * 60 * 1000),
    season = getCurrentSeasonStart()
  }: ProcessPullRequestsOptions = {}
) {
  try {
    // check to see if any builders have been applied in the last 28 days and approve them if they have activity
    await reviewAppliedBuilders();
  } catch (error) {
    log.error('Error reviewing new builders', { error });
  }

  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved',
      builderNfts: {
        some: {
          season
        }
      },
      deletedAt: null
    },
    // sort by id so that we can start mid-way if we need to
    orderBy: {
      id: 'asc'
    },
    select: {
      createdAt: true,
      id: true,
      githubUsers: {
        select: {
          events: {
            take: 1,
            select: {
              id: true
            }
          },
          id: true,
          login: true
        }
      }
    }
  });

  log.info(`Processing activity for ${builders.length} builders`);

  for (const builder of builders) {
    try {
      // If the builder was created less than and hr and has no existing events
      const newBuilder =
        builder.createdAt > new Date(Date.now() - 60 * 60 * 1000) && !builder.githubUsers[0]?.events[0];

      if (newBuilder) {
        log.info(`Detected new builder. Pulling in github data for this season`, {
          userId: builder.id,
          githubUserId: builder.githubUsers[0]?.id
        });
      }

      await processBuilderActivity({
        builderId: builder.id,
        githubUser: builder.githubUsers[0]!,
        createdAfter: newBuilder ? getDateFromISOWeek(getCurrentWeek()).toJSDate() : createdAfter,
        season
      });

      if (builders.indexOf(builder) % 10 === 0) {
        log.debug(`Processed ${builders.indexOf(builder)}/${builders.length} builders.`, {
          lastId: builder.id, // log last id in case we want to start in the middle of the process
          builders: builders
            .slice(builders.indexOf(builder), builders.indexOf(builder) + 10)
            .map((b) => b.githubUsers[0].login)
        });
      }
    } catch (error) {
      log.error('Error processing builder activity', { error, builderId: builder.id });
    }
  }

  const week = getCurrentWeek();

  await updateBuildersRank({ week });

  await refreshBuilderLevels({ season: getCurrentSeasonStart() });

  await refreshEstimatedPayouts({ week }).catch((error) => {
    log.error('Error refreshing estimated payouts', { error, week });
  });
}
