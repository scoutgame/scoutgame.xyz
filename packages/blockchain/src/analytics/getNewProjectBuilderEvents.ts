import { log } from '@charmverse/core/log';
import type { OnchainActivityTier } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeason } from '@packages/dates/utils';
/**
 * Represents a builder event
 */
export type ProjectBuilderEvents = {
  projectId: string;
  tier: OnchainActivityTier;
  events: {
    builderId: string;
    gems: number;
  }[];
};

// this may need to return more than one event, eg. if the project moves up more than one tier at a time
export async function getNewProjectBuilderEvents(projectId: string, week: string): Promise<ProjectBuilderEvents[]> {
  const projects = await prisma.scoutProject.findFirstOrThrow({
    where: {
      id: projectId
    },
    include: {
      contracts: {
        include: {
          transactions: {
            where: {}
          }
        }
      }
    }
  });
  try {
    // TODO: Implement the logic to fetch builder events for the specified week
    // This might involve querying a database, calling an API, or other data sources

    // Placeholder implementation
    const events: ProjectBuilderEvents[] = [];

    log.debug('Fetching builder events for week', { week });

    return events;
  } catch (error) {
    log.error('Error retrieving builder events', { error, projectId, week });
    throw error;
  }
}

export async function recordProjectBuilderEvent(event: ProjectBuilderEvents, week: string) {
  const { projectId, tier, events } = event;
  const season = getCurrentSeason(week).start;

  await prisma.scoutProjectOnchainActivityEvent.create({
    data: {
      projectId,
      tier,
      week,
      builderEvents: {
        createMany: {
          data: events.map((e) => ({
            builderId: e.builderId,
            type: 'onchain_activity',
            week,
            season,
            gemsReceipts: {
              createMany: {
                data: [
                  {
                    gems: e.gems,
                    recipientId: e.builderId
                  }
                ]
              }
            }
          }))
        }
      }
    }
  });
}
