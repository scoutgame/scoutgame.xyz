import { prisma } from '@charmverse/core/prisma-client';
import type { Season } from '@packages/dates/config';
import { getStartOfWeek, getCurrentWeek, getCurrentSeasonStart } from '@packages/dates/utils';
import { refreshEstimatedPayouts } from '@packages/scoutgame/builderNfts/refreshEstimatedPayouts';
import { updateBuildersRank } from '@packages/scoutgame/builders/updateBuildersRank';
import { refreshDeveloperLevels } from '@packages/scoutgame/tokens/refreshDeveloperLevels';
import { attestGemReceipts } from '@packages/scoutgameattestations/attestGemReceipts';
import type Koa from 'koa';
import { DateTime } from 'luxon';

import { log } from './logger';
import { processDeveloperActivity } from './processDeveloperActivity';

export { log };

type ProcessPullRequestsOptions = {
  createdAfter?: Date;
  season?: Season;
};

export async function processAllDeveloperActivity(
  ctx?: Koa.Context | null,
  {
    createdAfter = getStartOfWeek(getCurrentWeek()).toJSDate(),
    season = getCurrentSeasonStart()
  }: ProcessPullRequestsOptions = {}
) {
  const developers = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved',
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
  log.info(`Processing activity for ${developers.length} developers in batches of 5`);

  const batchSize = 5;
  let processedCount = 0;

  // Process developers in batches of 5
  for (let i = 0; i < developers.length; i += batchSize) {
    const batch = developers.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;

    // Process current batch concurrently using .then/.catch
    await Promise.all(
      batch.map((developer) =>
        processDeveloperActivity({
          builderId: developer.id,
          githubUser: developer.githubUsers[0]!,
          createdAfter,
          season
        }).catch((error) => {
          log.error('Error processing developer activity', { error, userId: developer.id });
        })
      )
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));

    processedCount += batch.length;

    // Log progress every 30 developers (6 batches)
    if (processedCount % 30 === 0 || processedCount === developers.length) {
      log.debug(`Processed ${processedCount}/${developers.length} developers`, {
        developerIds: batch.map((d) => d.id).join(', '),
        batchNumber,
        durationMinutes: Math.abs(timer.diff(DateTime.now(), 'minutes').minutes)
      });
    }
  }

  log.info('Finished processing Github activity for developers', {
    durationMinutes: Math.abs(timer.diff(DateTime.now(), 'minutes').minutes),
    totalDevelopers: developers.length
  });

  await updateStats({ week: getCurrentWeek(), season });

  await attestGemReceipts().catch((error) => {
    log.error('Error attesting gem receipts', { error });
  });
}

async function updateStats({ week, season }: { week: string; season: Season }) {
  await updateBuildersRank({ week })
    .then((leaderBoard) => {
      log.info('Developers rank updated', { week, leaderBoard });
    })
    .catch((error) => {
      log.error('Error updating developers rank', { error, week });
    });

  await refreshDeveloperLevels({ season })
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
