import { prisma } from '@charmverse/core/prisma-client';
import type {
  Prisma,
  ScoutProject,
  ScoutProjectContract,
  ScoutProjectMemberRole
} from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/dates/utils';

export type ScoutProjectDetailed = Pick<
  ScoutProject,
  'id' | 'path' | 'avatar' | 'name' | 'description' | 'website' | 'github'
> & {
  contracts: (Pick<ScoutProjectContract, 'id' | 'address' | 'chainId' | 'deployerId'> & {
    txCount?: number;
  })[];
  teamMembers: {
    id: string;
    path: string;
    avatar: string;
    displayName: string;
    role: ScoutProjectMemberRole;
  }[];
  deployers: {
    id: string;
    address: string;
  }[];
  wallets: {
    address: string;
    chainId: number | null;
    chainType: 'evm' | 'solana' | null;
    txCount?: number;
  }[];
};

// TODO: Add week to the data model?
const projectDetailedSelect = (week: string) =>
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
            week
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
            path: true
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
        address: true,
        chainId: true,
        chainType: true,
        dailyStats: {
          where: {
            week
          }
        }
      }
    }
  }) satisfies Prisma.ScoutProjectSelect;

export async function getProjectByPath(path: string, week = getCurrentWeek()): Promise<ScoutProjectDetailed | null> {
  const scoutProject = await prisma.scoutProject.findUnique({
    where: {
      path
    },
    select: projectDetailedSelect(week)
  });

  if (!scoutProject) {
    return null;
  }

  return {
    ...scoutProject,
    contracts: scoutProject.contracts.map((contract) => ({
      ...contract,
      // return undefined so we know the data is not available
      txCount: contract.dailyStats.length
        ? contract.dailyStats.reduce((acc, curr) => acc + curr.transactions, 0)
        : undefined
    })),
    wallets: scoutProject.wallets.map((wallet) => ({
      ...wallet,
      // return undefined so we know the data is not available
      txCount: wallet.dailyStats.length
        ? wallet.dailyStats.reduce((acc, curr) => acc + curr.transactions, 0)
        : undefined
    })),
    teamMembers: scoutProject.members.map((member) => ({
      id: member.user.id,
      avatar: member.user.avatar ?? '',
      displayName: member.user.displayName,
      role: member.role,
      path: member.user.path
    }))
  };
}
