import type { ScoutPartner, ScoutPartnerStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export type CreateScoutPartnerPayload = {
  name: string;
  icon: string;
  bannerImage: string;
  infoPageImage: string;
  status: ScoutPartnerStatus;
  tokenAmountPerPullRequest?: number;
  tokenAddress?: string;
  tokenChain?: number;
  tokenSymbol?: string;
  tokenDecimals?: number;
  tokenImage?: string;
};

export async function createScoutPartner(params: CreateScoutPartnerPayload): Promise<ScoutPartner> {
  const id = params.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return prisma.scoutPartner.create({
    data: {
      id,
      ...params
    }
  });
}
