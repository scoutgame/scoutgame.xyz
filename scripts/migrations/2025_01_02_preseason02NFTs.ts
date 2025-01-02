import { prisma } from '@charmverse/core/prisma-client';
import { registerBuilderNFT } from '@packages/scoutgame/builderNfts/builderRegistration/registerBuilderNFT';
import { DateTime } from 'luxon';

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
      season: '2025-W01', // dev preseason 2. production will be 2025-W02
      contractAddress: '0x8f2d2de6e1a7227021ad0ee3095fa3159560f96c' // dev preseason 2
      // imageHostingBaseUrl:
    });
  }
})();
