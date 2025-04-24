import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { registerDeveloperStarterNFT } from '@packages/scoutgame/builderNfts/registration/registerDeveloperStarterNFT';

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
  const starterNfts = await prisma.builderNft.findMany({
    where: {
      nftType: 'starter_pack',
      season: getCurrentSeasonStart()
    }
  });
  console.log('starter nfts', starterNfts.length);
  console.log('builders to mint starter pack nft', builders.length);
  for (const builder of builders) {
    await registerDeveloperStarterNFT({
      builderId: builder.id,
      season: getCurrentSeasonStart()
    });
  }
}
deployStarterPack().catch(console.error);
