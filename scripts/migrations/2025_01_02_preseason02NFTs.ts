import { prisma } from '@charmverse/core/prisma-client';
import { registerBuilderNFT } from '@packages/scoutgame/builderNfts/builderRegistration/registerBuilderNFT';

import { starterPackBuilders } from '@packages/scoutgame/builderNfts/builderRegistration/starterPack/starterPackBuilders';
import { registerBuilderStarterPackNFT } from '@packages/scoutgame/builderNfts/builderRegistration/registerBuilderStarterPackNFT';
import { nftChain } from '@packages/scoutgame/builderNfts/constants';

// dev preseason 2
const season = '2025-W02';
const contractAddress = '0x8f2d2de6e1a7227021ad0ee3095fa3159560f96c';
// const starterPackContractAddress = ???;

// production preseason 2
// const season = '2025-W02';
// const contractAddress = ???;

(async () => {
  // 1. Get all builders with a builder status of approved
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved',
      deletedAt: null
    }
  });

  for (const builder of builders) {
    await registerBuilderNFT({
      builderId: builder.id,
      season,
      contractAddress,
      chain: nftChain
      // imageHostingBaseUrl:
    });
    // if (starterPackBuilders.some((b) => b.fid === builder.farcasterId)) {
    //   await registerBuilderStarterPackNFT({
    //     builderId: builder.id,
    //     season,
    //     contractAddress: starterPackContractAddress
    //   });
    // }
  }
})();
