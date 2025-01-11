import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { registerBuilderStarterPackNFT } from '@packages/scoutgame/builderNfts/builderRegistration/registerBuilderStarterPackNFT';
import { starterPackBuilders } from '@packages/scoutgame/builderNfts/builderRegistration/starterPack/starterPackBuilders';

async function deployStarterPack() {
  const builders = await prisma.scout.findMany({
    where: {
      farcasterId: { in: starterPackBuilders.map((b) => b.fid) }
    },
    select: {
      id: true,
      displayName: true,
      path: true,
      builderNfts: {
        where: {
          season: getCurrentSeasonStart()
        }
      }
    }
  });

  for (const builder of builders) {
    await registerBuilderStarterPackNFT({
      builderId: builder.id,
      season: getCurrentSeasonStart()
    });
  }
}
