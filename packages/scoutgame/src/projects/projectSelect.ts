import type { Prisma } from '@charmverse/core/prisma-client';

export const projectDetailedSelect = {
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
      chainId: true,
      deployerId: true
    }
  },
  scoutProjectMembers: {
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
  scoutProjectDeployers: {
    select: {
      id: true,
      address: true
    }
  }
} satisfies Prisma.ScoutProjectSelect;

export const projectMinimalSelect = {
  id: true,
  name: true,
  avatar: true,
  path: true
} satisfies Prisma.ScoutProjectSelect;
