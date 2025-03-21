import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

export async function countStarterPackTokensPurchased(scoutId?: string): Promise<number> {
  if (!scoutId) {
    return 0;
  }

  const count = await prisma.scoutNft.count({
    where: {
      builderNft: { nftType: 'starter_pack', season: getCurrentSeasonStart() },
      scoutWallet: { scoutId }
    }
  });

  return count;
}
