import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { registerBuilderStarterPackNFT } from '@packages/scoutgame/builderNfts/builderRegistration/registerBuilderStarterPackNFT';

async function deployStarterPack() {
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved',
      builderNfts: {
        none: {
          nftType: 'starter_pack'
        }
      }
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
  console.log('builders to mint starter pack nft', builders.length);
  for (const builder of builders) {
    await registerBuilderStarterPackNFT({
      builderId: builder.id,
      season: getCurrentSeasonStart()
    });
  }
}
