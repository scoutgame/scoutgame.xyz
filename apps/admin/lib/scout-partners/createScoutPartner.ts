import type { ScoutPartner } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export type CreateScoutPartnerParams = {
  id: string;
  name: string;
  icon: string;
  bannerImage: string;
  infoPageImage: string;
  tokenAmountPerPullRequest?: number;
  tokenAddress?: string;
  tokenChain?: number;
  tokenSymbol?: string;
  tokenDecimals?: number;
  tokenImage?: string;
};

export async function createScoutPartner(params: CreateScoutPartnerParams): Promise<ScoutPartner> {
  return prisma.scoutPartner.create({
    data: params
  });
}
