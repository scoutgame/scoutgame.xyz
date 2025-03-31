import type { ScoutMatchup, Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type MyMatchup = Pick<ScoutMatchup, 'submittedAt' | 'totalScore' | 'rank'> & {
  selections: { developer: Pick<Scout, 'id' | 'displayName' | 'path' | 'avatar'> }[];
};

export async function getMyMatchup({ scoutId, week }: { scoutId: string; week: string }): Promise<MyMatchup | null> {
  return prisma.scoutMatchup.findFirst({
    where: {
      createdBy: scoutId,
      week
    },
    select: {
      submittedAt: true,
      totalScore: true,
      rank: true,
      selections: {
        select: {
          developer: {
            select: {
              id: true,
              displayName: true,
              path: true,
              avatar: true
            }
          }
        }
      }
    }
  });
}
