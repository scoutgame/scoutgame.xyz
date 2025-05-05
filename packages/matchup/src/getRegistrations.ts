import { prisma } from '@charmverse/core/prisma-client';

type MatchupRegistration = {
  scout: {
    id: string;
    displayName: string;
    avatar: string;
    path: string;
  };
};

// get registrations but do not reveal which developers were selected
export async function getRegistrations(week: string): Promise<MatchupRegistration[]> {
  const entries = await prisma.scoutMatchup.findMany({
    where: {
      week,
      OR: [
        {
          registrationTx: { status: 'success' }
        },
        { freeRegistration: true }
      ]
    },
    orderBy: {
      createdAt: 'asc'
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
