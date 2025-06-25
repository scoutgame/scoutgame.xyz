import type { ScoutPartnerStatus } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type ScoutPartnerInfo = {
  href: string;
  text: string;
  image: string;
  status: ScoutPartnerStatus;
};

export async function getScoutPartnersInfo({
  allStatus = false
}: {
  allStatus?: boolean;
} = {}): Promise<ScoutPartnerInfo[]> {
  const scoutPartners = await prisma.scoutPartner.findMany({
    where: {
      status: allStatus ? undefined : 'active'
    },
    select: {
      id: true,
      name: true,
      icon: true,
      status: true
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
    status: partner.status
  }));
}
