import { prisma } from '@charmverse/core/prisma-client';

export type ScoutMatchupEntry = {
  scout: {
    id: string;
    displayName: string;
    avatar: string;
    path: string;
  };
};

export async function getEntriesDuringRegistration(week: string): Promise<ScoutMatchupEntry[]> {
  const entries = await prisma.scoutMatchup.findMany({
    where: {
      week
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      scout: {
        select: {
          id: true,
          displayName: true,
          avatar: true,
          path: true
        }
      }
    }
  });
  return entries.map((entry) => ({
    scout: {
      id: entry.scout.id,
      displayName: entry.scout.displayName,
      avatar: entry.scout.avatar || '',
      path: entry.scout.path
    }
  }));
}
