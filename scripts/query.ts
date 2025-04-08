import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';
import { getCurrentWeek } from '@packages/dates/utils';
import { getCurrentSeasonStart } from '@packages/dates/utils';

async function query() {
  const matchups = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved',
      wallets: {
        none: {}
      }
    }
  });
  console.log(matchups.length);
  console.log(matchups.map((m) => m.email).join('\n'));
}
query();
