import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

export async function createFreeMatchup({ scoutId, week }: { scoutId: string; week: string }) {
  const matchup = await prisma.scoutMatchup.findFirst({
    where: {
      createdBy: scoutId,
      week
    }
  });
  if (matchup) {
    log.debug('Matchup already exists, skipping', {
      week,
      scoutId
    });
  } else {
    return prisma.scoutMatchup.create({
      data: {
        createdBy: scoutId,
        week,
        freeRegistration: true
      }
    });
  }
}
