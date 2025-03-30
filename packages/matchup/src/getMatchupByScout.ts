import { prisma } from '@charmverse/core/prisma-client';

export async function getMatchupByScout({ scoutId, week }: { scoutId: string; week: string }) {
  const matchup = await prisma.scoutMatchup.findFirst({
    where: {
      scoutId,
      week
    },
    select: {
      submittedAt: true,
      totalScore: true,
      rank: true,
      selections: {
        include: {
          developer: {
            select: {
              id: true,
              displayName: true,
              path: true,
              name: true,
              avatar: true
            }
          }
        }
      }
    }
  });
}
