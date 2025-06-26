import type { ScoutPartner, ScoutPartnerStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export type UpdateScoutPartnerPayload = {
  tokenAmountPerPullRequest?: number;
  status: ScoutPartnerStatus;
  tokenSymbol?: string;
};

export async function updateScoutPartner(id: string, params: UpdateScoutPartnerPayload): Promise<ScoutPartner> {
  return prisma.scoutPartner.update({
    where: { id },
    data: params
  });
}
