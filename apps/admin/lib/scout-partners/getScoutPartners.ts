import type { ScoutPartner } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type ScoutPartnerWithRepos = ScoutPartner & { repos: { id: number; owner: string; name: string }[] };

export async function getScoutPartners(): Promise<ScoutPartnerWithRepos[]> {
  return prisma.scoutPartner.findMany({
    orderBy: {
      name: 'asc'
    },
    include: {
      repos: {
        select: {
          id: true,
          owner: true,
          name: true
        }
      }
    }
  });
}
