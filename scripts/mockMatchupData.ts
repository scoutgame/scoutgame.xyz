import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { mockBuilder, mockScoutedNft, mockUserSeasonStats } from '@packages/testing/database';
import { sendPointsForMiscEvent } from '@packages/scoutgame/points/builderEvents/sendPointsForMiscEvent';

const builderDisplayName = 'coral-beaver';

// use this script to set up some mock data for weekly matchup

async function query() {
  const scout = await prisma.scout.findFirstOrThrow({
    where: {
      path: builderDisplayName
    }
  });

  await sendPointsForMiscEvent({
    builderId: scout.id,
    points: -1000,
    description: 'Mock matchup data',
    claimed: true,
    hideFromNotifications: true
  });
  console.log('1000 Points added to wallet');

  for (let i = 0; i < 12; i++) {
    const builder = await mockBuilder({ createNft: true, nftSeason: getCurrentSeasonStart() });
    const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    await mockUserSeasonStats({
      userId: builder.id,
      season: getCurrentSeasonStart(),
      level: Math.floor(Math.random() * levels.length)
    });
    // purchase a subset of the builders
    if (i <= 6) {
      await mockScoutedNft({
        builderId: builder.id,
        scoutId: scout.id,
        season: getCurrentSeasonStart()
      });
    }
  }
  console.log('Mock data generated');
}

query().catch(console.error);
