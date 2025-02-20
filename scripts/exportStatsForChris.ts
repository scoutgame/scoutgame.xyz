import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';
import fs from 'fs';
import { getNewScouts } from '@packages/scoutgame/scouts/getNewScouts';
import { getCurrentWeek } from '@packages/dates/utils';

async function exportStats() {
  const today = DateTime.utc().startOf('day');
  const yesterday = today.minus({ days: 1 }).toJSDate();

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
  console.log(builderActivities.slice(0, 5));

  // 2. Most active builders
  const activeBuilders = await prisma.builderEvent.groupBy({
    by: ['builderId'],
    where: {
      type: 'merged_pull_request',
      createdAt: {
        gte: yesterday,
        lt: today.toJSDate()
      }
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
  console.log(activeBuilders);

  const activeBuilderDetails = await Promise.all(
    activeBuilders.map(async ({ builderId }) => {
      const events = await prisma.builderEvent.findMany({
        where: {
          builderId,
          createdAt: {
            gte: yesterday
          }
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
        eventCount: events.length,
        repos: [...new Set(events.map((e) => e.githubEvent?.repo?.name))]
      };
    })
  );

  // 3. New scouts who bought NFTs
  const newScouts = await getNewScouts({ week: getCurrentWeek() });
  const newScoutPurchases = await prisma.nFTPurchaseEvent.findMany({
    where: {
      createdAt: {
        gte: yesterday,
        lt: today.toJSDate()
      },
      scoutWallet: {
        scout: {
          id: {
            in: newScouts.map((s) => s.wallets[0].address)
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

  // 4. Builders who contributed to bonus partner repos
  const bonusPartnerContributions = await prisma.builderEvent.findMany({
    where: {
      createdAt: {
        gte: yesterday,
        lt: today.toJSDate()
      },
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
      }
    }
  });

  const stats = {
    rankChanges: builderActivities.map((rc) => ({
      builder: rc.builder,
      rankChange: rc.rankChange
    })),
    activeBuilders: activeBuilderDetails,
    newScoutPurchases: newScoutPurchases.map((purchase) => ({
      scout: purchase.buyer,
      boughtFrom: purchase.builderNFT.builder
    })),
    bonusPartnerContributions: bonusPartnerContributions.map((contribution) => ({
      builder: contribution.builder,
      partner: contribution.bonusPartner?.name,
      repo: contribution.repo
    }))
  };

  fs.writeFileSync('builderStats.json', JSON.stringify(stats, null, 2));
  console.log('Stats exported to builderStats.json');
}

exportStats().catch(console.error);
