import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { refreshBuilderNftPrice } from '@packages/scoutgame/builderNfts/refreshBuilderNftPrice';
import { getCurrentSeasonStart } from '@packages/dates/utils';

export async function fixNftPrice() {
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved'
    },
    select: {
      id: true
    }
  });

  let totalBuilders = builders.length;
  let currentBuilder = 0;

  const currentSeasonStart = getCurrentSeasonStart();
  for (const builder of builders) {
    try {
      await refreshBuilderNftPrice({
        builderId: builder.id,
        season: currentSeasonStart
      });
      console.log(`Builder updated ${++currentBuilder}/${totalBuilders}`);
    } catch (err) {
      log.error('Error updating builder nft price', { userId: builder.id });
    }
  }
}

fixNftPrice();
