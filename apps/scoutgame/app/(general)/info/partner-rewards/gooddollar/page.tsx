import { prisma } from '@charmverse/core/prisma-client';
import type { Metadata } from 'next';

import { GoodDollarPage } from 'components/info/partner-rewards/GoodDollarPage';

export const metadata: Metadata = {
  title: 'GoodDollar Partner Rewards'
};

export default async function GoodDollar() {
  const scoutPartner = await prisma.scoutPartner.findUniqueOrThrow({
    where: {
      id: 'gooddollar'
    },
    select: {
      infoPageImage: true
    }
  });
  return <GoodDollarPage infoPageImage={scoutPartner?.infoPageImage} />;
}
