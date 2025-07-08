import type { ScoutPartner } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { EditScoutPartnerPayload } from './editScoutPartnerSchema';

export async function editScoutPartner(id: string, params: EditScoutPartnerPayload): Promise<ScoutPartner> {
  // Handle repo associations
  if (params.repoIds !== undefined) {
    // First, remove the partner from all currently associated repos
    await prisma.githubRepo.updateMany({
      where: { scoutPartnerId: id },
      data: { scoutPartnerId: null }
    });

    // Then associate the new repos with the partner
    if (params.repoIds.length > 0) {
      await prisma.githubRepo.updateMany({
        where: { id: { in: params.repoIds } },
        data: { scoutPartnerId: id }
      });
    }
  }

  return prisma.scoutPartner.update({
    where: { id },
    data: params
  });
}
