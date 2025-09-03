import type { ScoutPartner } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type ScoutPartnerWithRepos = ScoutPartner & {
  repos: { id: number; owner: string; name: string }[];
  blacklistedDevelopers: { developerId: string; developer: { id: string; path: string; displayName: string | null } }[];
};

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
      },
      blacklistedDevelopers: {
        select: {
          developerId: true,
          developer: {
            select: { id: true, path: true, displayName: true }
          }
        }
      }
    }
  });
}
