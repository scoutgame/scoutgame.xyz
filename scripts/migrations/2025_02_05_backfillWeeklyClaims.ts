import { getAllISOWeeksFromSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { prisma } from '@charmverse/core/prisma-client';

async function backfillWeeklyClaims() {
  const season = '2025-W02';

  const allWeeks = getAllISOWeeksFromSeasonStart({ season });

  const currentWeek = getCurrentWeek();

  for (const week of allWeeks) {
    if (week >= currentWeek) {
      break;
    }

    await prisma.weeklyClaims.upsert({
      where: {
        week
      },
      create: {
        week,
        season,
        claims: [],
        merkleTreeRoot: '',
        proofsMap: {},
        totalClaimable: 0
      },
      update: {}
    });
  }

  console.log(allWeeks);
}

// backfillWeeklyClaims();
