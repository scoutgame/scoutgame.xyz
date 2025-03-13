import { log } from '@charmverse/core/log';
import type { OnchainAchievementTier } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeason } from '@packages/dates/utils';

/**
 * Represents a builder event
 */
export type ProjectAchievement = {
  projectId: string;
  tier: OnchainAchievementTier;
  builders: {
    builderId: string;
    gems: number;
  }[];
};

const tiers = {
  bronze: {
    gems: 1, // gems per week, divided by builders
    minTransactions: 1
  },
  silver: {
    gems: 50,
    minTransactions: 200
  },
  gold: {
    gems: 100,
    minTransactions: 1800
  }
} satisfies Record<OnchainAchievementTier, { gems: number; minTransactions: number }>;

// this may need to return more than one event, eg. if the project moves up more than one tier at a time
export async function getNewProjectAchievements(projectId: string, week: string): Promise<ProjectAchievement[]> {
  const projects = await prisma.scoutProject.findFirstOrThrow({
    where: {
      id: projectId
    },
    include: {
      members: {
        where: {
          deletedAt: null
        },
        select: {
          user: {
            select: {
              id: true,
              email: true
            }
          }
        }
      },
      onchainAchievements: {
        where: {
          week
        }
      },
      contracts: {
        include: {
          dailyStats: {
            where: {
              week
            }
          }
        }
      }
    }
  });
  try {
    log.debug('Fetching builder events for week', { week });

    // Get total transactions for this week
    const totalTransactions = projects.contracts.reduce(
      (sum, { dailyStats }) => sum + dailyStats.reduce((_sum, { transactions }) => _sum + transactions, 0),
      0
    );

    // get member ids
    const memberIds = projects.members.map((member) => member.user.id);
    // Check if we already have events for this tier
    const existingTiers = projects.onchainAchievements.map((event) => event.tier);

    log.debug('Total transactions for the week', { totalTransactions, projectId, week });

    // Determine tier based on transaction count
    const achievements: ProjectAchievement[] = [];

    for (const [tier, tierConfig] of Object.entries(tiers)) {
      if (totalTransactions >= tierConfig.minTransactions && !existingTiers.includes(tier as OnchainAchievementTier)) {
        const gemsPayout = Math.floor(tierConfig.gems / memberIds.length);
        achievements.push({
          projectId,
          tier: tier as OnchainAchievementTier,
          builders: memberIds.map((id) => ({
            builderId: id,
            gems: gemsPayout
          }))
        });
      }
    }

    return achievements;
  } catch (error) {
    log.error('Error retrieving builder events', { error, projectId, week });
    throw error;
  }
}

export async function recordProjectAchievement(achievement: ProjectAchievement, week: string) {
  const { projectId, tier, builders } = achievement;
  const season = getCurrentSeason(week).start;

  await prisma.scoutProjectOnchainAcheivement.create({
    data: {
      projectId,
      tier,
      week,
      builderEvents: {
        createMany: {
          data: builders.map((b) => ({
            builderId: b.builderId,
            type: 'onchain_activity',
            week,
            season,
            gemsReceipts: {
              createMany: {
                data: [
                  {
                    gems: b.gems,
                    recipientId: b.builderId
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
