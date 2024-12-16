import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason } from '../dates';

export async function aggregateTokensPurchased(scoutId: string) {
  const purchases = await prisma.nFTPurchaseEvent.aggregate({
    where: { builderNft: { nftType: 'starter_pack', season: currentSeason }, scoutId },
    _sum: { tokensPurchased: true }
  });

  return purchases._sum.tokensPurchased || 0;
}
