import { prisma } from '@charmverse/core/prisma-client';

export type ScoutMatchupEntry = {
  id: string;
  displayName: string;
  avatar: string;
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
          avatar: true
        }
      }
    }
  });
  return entries.map((entry) => ({
    id: entry.scout.id,
    displayName: entry.scout.displayName,
    avatar: entry.scout.avatar || ''
  }));
}
