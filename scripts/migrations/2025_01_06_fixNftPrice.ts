import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { refreshBuilderNftPrice } from '@packages/scoutgame/builderNfts/refreshBuilderNftPrice';
import { getCurrentSeasonStart } from '@packages/scoutgame/dates/utils';

export async function fixNftPrice() {
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: {
        not: null
      }
    },
    select: {
      id: true,
    }
  })

  const currentSeasonStart = getCurrentSeasonStart()
  for (const builder of builders) {
    try {
      await refreshBuilderNftPrice({
        builderId: builder.id,
        season: currentSeasonStart
      })
    } catch (err) {
      log.error('Error updating builder nft price', {userId: builder.id})
    }
  }
}

fixNftPrice()