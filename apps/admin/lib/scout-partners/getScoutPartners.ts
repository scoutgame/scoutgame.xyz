import { prisma } from '@charmverse/core/prisma-client';

export async function getScoutPartners() {
  return prisma.scoutPartner.findMany({
    orderBy: {
      name: 'asc'
    }
  });
}
