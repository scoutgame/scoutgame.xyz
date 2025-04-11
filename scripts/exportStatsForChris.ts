import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';
import fs from 'fs';
import { getNewScouts } from '@packages/scoutgame/scouts/getNewScouts';
import { getCurrentWeek } from '@packages/dates/utils';
import type { Last14DaysRank } from '@packages/scoutgame/builders/interfaces';

type Person = {
  displayName: string;
};

type Stats = {
  date: string;
  builder_rank_changes: {
    builder: Person;
    rank_change: number;
  }[];
  active_builders: {
    builder: Person;
    github: {
      pull_request_count: number;
      pull_request_repositories: string[];
    };
  }[];
  new_scout_nft_purchases: {
    buyer: Person;
    builder: Person;
  }[];
  reward_partner_contributions: {
    builder: Person;
    reward_partner: string;
    pull_request: {
      github_repository: string;
    };
  }[];
};

async function exportStats() {
  const today = DateTime.utc().startOf('day');
  const yesterday = today.minus({ days: 1 });

  const timeRangeCondition = {
    gte: yesterday.toJSDate(),
    lt: today.toJSDate()
  };

  // 1. Builders who moved up in rank
  const builderActivities = await prisma.builderCardActivity.findMany({
    where: {
      builder: {
        builderStatus: 'approved'
      }
    },
    include: {
      builder: {
        select: {
          displayName: true
        }
      }
    }
  });
  const rankChanges: Stats['builder_rank_changes'] = builderActivities
    .map(({ builder, last14Days }) => {
      const last14DaysTyped = last14Days as Last14DaysRank;
      const lastTwoDays = last14DaysTyped.slice(-2);
      const rankChange = lastTwoDays.length >= 2 ? (lastTwoDays[0].rank || 0) - (lastTwoDays[1].rank || 0) : 0;
      return {
        builder,
        rank_change: rankChange
      };
    })
    .filter((ba) => ba.rank_change > 0)
    // sort by rank change
    .sort((a, b) => b.rank_change - a.rank_change);

  // 2. Most active builders
  const activeBuildersData = await prisma.builderEvent.groupBy({
    by: ['builderId'],
    where: {
      type: 'merged_pull_request',
      createdAt: timeRangeCondition
    },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 10
  });
  console.log('most active builders', activeBuildersData.length);

  const activeBuilders: Stats['active_builders'] = (
    await Promise.all(
      activeBuildersData.map(async ({ builderId, _count }) => {
        const events = await prisma.builderEvent.findMany({
          where: {
            builderId,
            createdAt: timeRangeCondition,
            type: 'merged_pull_request'
          },
          select: {
            githubEvent: {
              select: {
                repo: {
                  select: {
                    name: true,
                    owner: true
                  }
                }
              }
            },
            builder: {
              select: {
                displayName: true,
                path: true
              }
            }
          }
        });
        return {
          builder: events[0]?.builder,
          github: {
            pull_request_count: events.length,
            pull_request_repositories: [...new Set(events.map((e) => e.githubEvent!.repo!.name))]
          }
        };
      })
    )
  ).sort((a, b) => b.github.pull_request_count - a.github.pull_request_count);

  // 3. New scouts who bought NFTs
  const newScouts = await getNewScouts({ week: getCurrentWeek() });
  const newScoutPurchasesData = await prisma.nFTPurchaseEvent.findMany({
    where: {
      createdAt: timeRangeCondition,
      scoutWallet: {
        scout: {
          id: {
            in: newScouts.map((s) => s.id)
          }
        }
      }
    },
    include: {
      scoutWallet: {
        select: {
          scout: {
            select: {
              displayName: true
            }
          }
        }
      },
      builderNft: {
        select: {
          builder: {
            select: {
              displayName: true
            }
          }
        }
      }
    }
  });
  const newScoutPurchases: Stats['new_scout_nft_purchases'] = newScoutPurchasesData.map((purchase) => ({
    buyer: purchase.scoutWallet!.scout,
    builder: purchase.builderNft.builder
  }));

  // 4. Builders who contributed to bonus partner repos
  const builderEventsForPartners = await prisma.builderEvent.findMany({
    where: {
      createdAt: timeRangeCondition,
      bonusPartner: {
        not: null
      }
    },
    include: {
      builder: {
        select: {
          displayName: true,
          path: true
        }
      },
      githubEvent: {
        select: {
          repo: {
            select: { name: true }
          }
        }
      }
    }
  });
  // de-dupe builderEventsForPartners by builder
  const rewardPartnerContributions = builderEventsForPartners.reduce<Stats['reward_partner_contributions']>(
    (acc, event) => {
      if (!acc.find((e) => e.builder.displayName === event.builder.displayName)) {
        acc.push({
          builder: event.builder,
          reward_partner: event.bonusPartner!,
          pull_request: {
            github_repository: event.githubEvent!.repo!.name
          }
        });
      }
      return acc;
    },
    []
  );

  const stats: Stats = {
    date: yesterday.toFormat('yyyy-MM-dd'),
    builder_rank_changes: rankChanges,
    active_builders: activeBuilders,
    new_scout_nft_purchases: newScoutPurchases,
    reward_partner_contributions: rewardPartnerContributions
  };

  fs.writeFileSync('builderStats.json', JSON.stringify(stats, null, 2));
  console.log('Stats exported to builderStats.json');
  console.log(JSON.stringify(stats, null, 2));
}

exportStats().catch(console.error);
