import { prisma } from '@charmverse/core/prisma-client';
import { registerDeveloperNFT } from '@packages/scoutgame/builderNfts/registration/registerDeveloperNFT';

import { starterPackBuilders } from '@packages/scoutgame/builderNfts/registration/starterPack/starterPackBuilders';
import { registerDeveloperStarterNFT } from '@packages/scoutgame/builderNfts/registration/registerDeveloperStarterNFT';
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
    await registerDeveloperNFT({
      builderId: builder.id,
      season,
      contractAddress,
      chain: nftChain
      // imageHostingBaseUrl:
    });
    // if (starterPackBuilders.some((b) => b.fid === builder.farcasterId)) {
    //   await registerDeveloperStarterNFT({
    //     builderId: builder.id,
    //     season,
    //     contractAddress: starterPackContractAddress
    //   });
    // }
  }
})();
