import { prisma } from '@charmverse/core/prisma-client';
import type { Metadata } from 'next';

import { CeloPage } from 'components/info/partner-rewards/CeloPage';

export const metadata: Metadata = {
  title: 'Celo Partner Rewards'
};

export default async function Celo() {
  const scoutPartner = await prisma.scoutPartner.findUniqueOrThrow({
    where: {
      id: 'celo'
    },
    select: {
      infoPageImage: true
    }
  });
  return <CeloPage infoPageImage={scoutPartner?.infoPageImage} />;
}
