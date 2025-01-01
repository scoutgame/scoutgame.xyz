import { prisma } from '@charmverse/core/prisma-client';

import { getCurrentSeasonStart } from '../dates/utils';

export async function aggregateTokensPurchased(scoutId?: string) {
  if (!scoutId) {
    return 0;
  }

  const purchases = await prisma.nFTPurchaseEvent.aggregate({
    where: { builderNft: { nftType: 'starter_pack', season: getCurrentSeasonStart() }, scoutId },
    _sum: { tokensPurchased: true }
  });

  return purchases._sum.tokensPurchased || 0;
}
