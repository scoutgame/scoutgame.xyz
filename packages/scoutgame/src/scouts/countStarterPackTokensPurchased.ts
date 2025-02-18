import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { MAX_STARTER_PACK_PURCHASES as max } from '@packages/scoutgame/builderNfts/constants';

export async function countStarterPackTokensPurchased(scoutId?: string) {
  if (!scoutId) {
    return { max, purchased: 0, remaining: 0 };
  }

  const purchases = await prisma.nFTPurchaseEvent.aggregate({
    where: {
      builderNft: { nftType: 'starter_pack', season: getCurrentSeasonStart() },
      scoutWallet: { scoutId }
    },
    _sum: { tokensPurchased: true }
  });

  const purchased = purchases._sum.tokensPurchased || 0;

  return {
    max,
    purchased,
    remaining: max - purchased
  };
}
