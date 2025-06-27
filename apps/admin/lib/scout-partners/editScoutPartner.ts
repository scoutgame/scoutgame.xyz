import type { ScoutPartner } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { EditScoutPartnerPayload } from './editScoutPartnerSchema';

export async function editScoutPartner(id: string, params: EditScoutPartnerPayload): Promise<ScoutPartner> {
  return prisma.scoutPartner.update({
    where: { id },
    data: params
  });
}
