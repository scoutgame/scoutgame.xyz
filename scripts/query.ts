import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';
import { getCurrentWeek } from '@packages/dates/utils';
import { getCurrentSeasonStart } from '@packages/dates/utils';
console.log(getCurrentWeek());
async function query() {
  const matchups = await prisma.scoutMatchup.deleteMany({
    where: {
      week: '2025-W15'
    }
  });
  prettyPrint(matchups);
}

query();
