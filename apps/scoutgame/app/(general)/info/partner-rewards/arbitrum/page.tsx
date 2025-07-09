import { prisma } from '@charmverse/core/prisma-client';
import type { Metadata } from 'next';

import { ArbitrumPage } from 'components/info/partner-rewards/ArbitrumPage';

export const metadata: Metadata = {
  title: 'Arbitrum Partner Rewards'
};

export default async function ArbitrumPartnerRewards() {
  const scoutPartner = await prisma.scoutPartner.findUniqueOrThrow({
    where: {
      id: 'arbitrum'
    },
    select: {
      infoPageImage: true
    }
  });
  return <ArbitrumPage infoPageImage={scoutPartner?.infoPageImage} />;
}
