import type { ScoutPartnerStatus } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type ScoutPartnerInfo = {
  id: string;
  href: string;
  text: string;
  image: string;
  status: ScoutPartnerStatus;
  chain: number | null;
  tokenImage: string | null;
};

export async function getScoutPartnersInfo({
  status
}: {
  status?: ScoutPartnerStatus;
} = {}): Promise<ScoutPartnerInfo[]> {
  const scoutPartners = await prisma.scoutPartner.findMany({
    where: {
      status
    },
    select: {
      id: true,
      name: true,
      icon: true,
      status: true,
      tokenChain: true,
      tokenImage: true
    },
    orderBy: [
      {
        status: 'asc'
      },
      {
        name: 'asc'
      }
    ]
  });

  return scoutPartners.map((partner) => ({
    href: `/info/partner-rewards/${partner.id}`,
    text: partner.name,
    image: partner.icon,
    status: partner.status,
    id: partner.id,
    chain: partner.tokenChain,
    tokenImage: partner.tokenImage
  }));
}
