import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { ScoutProjectDetailed } from './getUserScoutProjects';

export const projectDetailedSelect = {
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
      deployerId: true
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
      chainType: true
    }
  }
} satisfies Prisma.ScoutProjectSelect;

export async function getProjectByPath(path: string): Promise<ScoutProjectDetailed | null> {
  const scoutProject = await prisma.scoutProject.findUnique({
    where: {
      path
    },
    select: projectDetailedSelect
  });

  if (!scoutProject) {
    return null;
  }

  return {
    ...scoutProject,
    teamMembers: scoutProject.members.map((member) => ({
      id: member.user.id,
      avatar: member.user.avatar ?? '',
      displayName: member.user.displayName,
      role: member.role,
      path: member.user.path
    }))
  };
}
