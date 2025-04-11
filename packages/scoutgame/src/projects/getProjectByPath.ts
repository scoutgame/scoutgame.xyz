import { prisma } from '@charmverse/core/prisma-client';
import type {
  Prisma,
  ScoutProject,
  ScoutProjectContract,
  ScoutProjectMemberRole,
  OnchainAchievementTier
} from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/dates/utils';
import { shortenHex } from '@packages/utils/strings';
import { DateTime } from 'luxon';

export type ProjectTeamMember = {
  id: string;
  path: string;
  avatar: string;
  displayName: string;
  role: ScoutProjectMemberRole;
  gemsThisWeek: number;
};

// a map of contract addresses to the number of transactions on a given day
export type ContractDailyStat = {
  date: string;
} & Record<string, number | string>;

export type ScoutProjectDetailed = Pick<
  ScoutProject,
  'id' | 'path' | 'avatar' | 'name' | 'description' | 'website' | 'github'
> & {
  tier: OnchainAchievementTier | undefined;
  contracts: (Pick<ScoutProjectContract, 'id' | 'address' | 'chainId' | 'deployerId'> & {
    loadingStats: boolean;
    txCount: number;
    dailyStats: any[];
  })[];
  teamMembers: ProjectTeamMember[];
  deployers: {
    id: string;
    address: string;
  }[];
  wallets: {
    address: string;
    chainId: number | null;
    chainType: 'evm' | 'solana' | null;
    loadingStats: boolean;
    txCount: number;
  }[];
  stats: {
    loading: boolean; // stats are calculated once a day
    totalTxCount: number;
    totalGems: number;
    contractDailyStats: ContractDailyStat[];
  };
};

const projectDetailedSelect = (lookback: Date) =>
  ({
    id: true,
    path: true,
    avatar: true,
    name: true,
    description: true,
    website: true,
    github: true,
    contracts: {
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        address: true,
        chainId: true,
        deployerId: true,
        dailyStats: {
          where: {
            day: {
              gte: lookback
            }
          },
          orderBy: {
            day: 'asc'
          }
        }
      }
    },
    members: {
      where: {
        deletedAt: null
      },
      select: {
        user: {
          select: {
            id: true,
            avatar: true,
            displayName: true,
            path: true,
            events: {
              where: {
                type: 'onchain_achievement',
                week: getCurrentWeek()
              },
              select: {
                createdAt: true,
                gemsReceipt: {
                  select: {
                    value: true
                  }
                },
                onchainAchievement: {
                  select: {
                    projectId: true, // need to filter by this project
                    tier: true
                  }
                }
              }
            }
          }
        },
        role: true
      }
    },
    deployers: {
      select: {
        id: true,
        address: true
      }
    },
    wallets: {
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        address: true,
        chainId: true,
        chainType: true,
        dailyStats: {
          where: {
            day: {
              gte: lookback
            }
          },
          orderBy: {
            day: 'asc'
          }
        }
      }
    }
  }) satisfies Prisma.ScoutProjectSelect;

export async function getProjectByPath(path: string): Promise<ScoutProjectDetailed | null> {
  const week = getCurrentWeek();
  const scoutProject = await prisma.scoutProject.findUnique({
    where: {
      path
    },
    select: projectDetailedSelect(DateTime.now().minus({ days: 14 }).toJSDate())
  });

  if (!scoutProject) {
    return null;
  }
  const allDailyStats = [
    ...scoutProject.contracts.flatMap((contract) => contract.dailyStats),
    ...scoutProject.wallets.flatMap((wallet) => wallet.dailyStats)
  ];
  const contractDailyStats = Object.entries(
    scoutProject.contracts.reduce<Record<string, Record<string, number>>>((acc, contract) => {
      const weeklyTotals = new Map<string, number>();
      contract.dailyStats.forEach(({ week: _week, day, transactions }) => {
        const date = day.toISOString();
        const weeklyTotal = weeklyTotals.get(_week) ?? 0;
        const newWeeklyTotal = weeklyTotal + transactions;
        weeklyTotals.set(_week, newWeeklyTotal);
        acc[date] = acc[date] ?? {};
        acc[date][shortenHex(contract.address)] = newWeeklyTotal;
      });
      return acc;
    }, {})
  ).map(([date, stats]) => ({
    date,
    ...stats
  }));

  // filter achievements from other projects for each member (since i couldnt figure out how to do this in the query)
  scoutProject.members.forEach((member) => {
    member.user.events = member.user.events.filter((event) => event.onchainAchievement?.projectId === scoutProject.id);
  });

  const tier = scoutProject.members
    .flatMap((member) => member.user.events)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.onchainAchievement?.tier;

  const teamMembers: ProjectTeamMember[] = scoutProject.members.map((member) => ({
    id: member.user.id,
    avatar: member.user.avatar ?? '',
    displayName: member.user.displayName,
    role: member.role,
    path: member.user.path,
    gemsThisWeek: member.user.events.reduce((acc, curr) => {
      return acc + (curr.gemsReceipt?.value ?? 0);
    }, 0)
  }));

  const projectGems = teamMembers.reduce((acc, curr) => acc + curr.gemsThisWeek, 0);

  return {
    ...scoutProject,
    contracts: scoutProject.contracts.map((contract) => ({
      ...contract,
      loadingStats: contract.dailyStats.length === 0,
      txCount: contract.dailyStats.reduce((acc, curr) => acc + curr.transactions, 0)
    })),
    wallets: scoutProject.wallets.map((wallet) => ({
      ...wallet,
      chainId: wallet.chainId!,
      loadingStats: wallet.dailyStats.length === 0,
      txCount: wallet.dailyStats.reduce((acc, curr) => acc + curr.transactions, 0)
    })),
    // take the latest tier from the members events
    tier,
    teamMembers,
    stats: {
      loading: allDailyStats.length === 0,
      totalTxCount: allDailyStats.filter((d) => d.week === week).reduce((acc, curr) => acc + curr.transactions, 0),
      totalGems: projectGems,
      contractDailyStats
    }
  };
}
