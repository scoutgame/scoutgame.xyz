import type { Prisma, ScoutProjectMemberRole } from '@charmverse/core/prisma-client';

export const projectSelect = {
  id: true,
  path: true,
  avatar: true,
  name: true,
  description: true,
  website: true,
  github: true,
  scoutProjectContracts: {
    select: {
      id: true,
      address: true,
      chainId: true
    }
  },
  scoutProjectMembers: {
    select: {
      user: {
        select: {
          id: true,
          avatar: true,
          displayName: true
        }
      },
      role: true
    }
  }
} satisfies Prisma.ScoutProjectSelect;

export const projectInfoSelect = {
  id: true,
  name: true,
  avatar: true,
  path: true
} satisfies Prisma.ScoutProjectSelect;
