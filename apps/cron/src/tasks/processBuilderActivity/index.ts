import { prisma } from '@charmverse/core/prisma-client';
import type { Season } from '@packages/dates/config';
import { getStartOfWeek, getCurrentWeek, getCurrentSeasonStart } from '@packages/dates/utils';
import { refreshEstimatedPayouts } from '@packages/scoutgame/builderNfts/refreshEstimatedPayouts';
import { updateBuildersRank } from '@packages/scoutgame/builders/updateBuildersRank';
import { refreshBuilderLevels } from '@packages/scoutgame/points/refreshBuilderLevels';
import type Koa from 'koa';
import { DateTime } from 'luxon';

import { log } from './logger';
import { processBuilderActivity } from './processBuilderActivity';

export { log };
type ProcessPullRequestsOptions = {
  createdAfter?: Date;
  season?: Season;
};

export async function processAllBuilderActivity(
  ctx?: Koa.Context | null,
  {
    createdAfter = getStartOfWeek(getCurrentWeek()).toJSDate(),
    season = getCurrentSeasonStart()
  }: ProcessPullRequestsOptions = {}
) {
  const developers = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved',
      builderNfts: {
        some: {
          season
        }
      },
      deletedAt: null
    },
    // Add a sort so that we can start mid-way if we need to (when running from a script)
    orderBy: {
      // createdAt: 'asc'
      currentBalance: 'desc'
    },
    select: {
      createdAt: true,
      currentBalance: true,
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
  const timer = DateTime.now();
  log.info(`Processing activity for ${developers.length} developers`);

  for (const developer of developers) {
    await processBuilderActivity({
      builderId: developer.id,
      githubUser: developer.githubUsers[0]!,
      createdAfter,
      season
    }).catch((error) => {
      log.error('Error processing developer activity', { error, userId: developer.id });
    });

    if (developers.indexOf(developer) % 30 === 0) {
      log.debug(`Processed ${developers.indexOf(developer)}/${developers.length} developers`, {
        lastCreatedAt: developer.currentBalance // log last createdAt in case we want to start in the middle of the process
      });
      // await updateStats({ week: getCurrentWeek(), season });
    }
  }
  log.info('Finished processing Github activity for developers', {
    durationMinutes: timer.diff(DateTime.now(), 'minutes').minutes
  });

  await updateStats({ week: getCurrentWeek(), season });
}

async function updateStats({ week, season }: { week: string; season: Season }) {
  await updateBuildersRank({ week })
    .then((leaderBoard) => {
      log.info('Developers rank updated', { week, leaderBoard });
    })
    .catch((error) => {
      log.error('Error updating developers rank', { error, week });
    });

  await refreshBuilderLevels({ season })
    .then((levels) => {
      log.info(`Refreshed developer levels for season ${season}. Ranked ${levels.length} developers`);
    })
    .catch((error) => {
      log.error('Error refreshing developer levels', { error, week, season });
    });

  await refreshEstimatedPayouts({ week })
    .then(() => {
      log.info('Estimated payouts refreshed', { week });
    })
    .catch((error) => {
      log.error('Error refreshing estimated payouts', { error, week });
    });
}
