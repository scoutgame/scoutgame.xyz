import { log } from '@charmverse/core/log';
import type { ScoutPartner } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { EditScoutPartnerPayload } from './editScoutPartnerSchema';

export async function editScoutPartner(id: string, params: EditScoutPartnerPayload): Promise<ScoutPartner> {
  // Separate repoIds from the other ScoutPartner fields
  const { repoIds, ...scoutPartnerData } = params;

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

  return prisma.scoutPartner.update({
    where: { id },
    data: scoutPartnerData // Only pass valid ScoutPartner fields
  });
}
