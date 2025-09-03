import { log } from '@charmverse/core/log';
import type { ScoutPartner } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { EditScoutPartnerPayload } from './editScoutPartnerSchema';

export async function editScoutPartner(id: string, params: EditScoutPartnerPayload): Promise<ScoutPartner> {
  // Separate repoIds and blacklist from the other ScoutPartner fields
  const { repoIds, blacklistedDeveloperIds, ...scoutPartnerData } = params;

  // Handle repo associations
  if (repoIds !== undefined) {
    // First, remove the partner from all currently associated repos
    const removedRepos = await prisma.githubRepo.updateMany({
      where: { scoutPartnerId: id },
      data: { scoutPartnerId: null }
    });

    log.info('Removed repos from scout partner', { removedRepos });

    // Then associate the new repos with the partner
    if (repoIds.length > 0) {
      const addedRepos = await prisma.githubRepo.updateMany({
        where: { id: { in: repoIds } },
        data: { scoutPartnerId: id }
      });

      log.info('Added repos to scout partner', { addedRepos });
    }
  }

  // Handle blacklisted developers
  if (blacklistedDeveloperIds !== undefined) {
    // Remove all current blacklisted developers for this partner
    const removedDevelopers = await prisma.blacklistedScoutPartnerDeveloper.deleteMany({
      where: { scoutPartnerId: id }
    });
    log.info('Removed blacklisted developers from scout partner', { removedDevelopers });

    if (blacklistedDeveloperIds.length > 0) {
      const items = blacklistedDeveloperIds
        .filter((devId): devId is string => Boolean(devId))
        .map((developerId) => ({ scoutPartnerId: id, developerId }));
      if (items.length) {
        const addedDevelopers = await prisma.blacklistedScoutPartnerDeveloper.createMany({
          data: items,
          skipDuplicates: true
        });
        log.info('Added blacklisted developers to scout partner', { addedDevelopers });
      }
    }
  }

  return prisma.scoutPartner.update({
    where: { id },
    data: scoutPartnerData // Only pass valid ScoutPartner fields
  });
}
