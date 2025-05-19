import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';
import { getCurrentWeek } from '@packages/dates/utils';
import { getCurrentSeasonStart } from '@packages/dates/utils';

async function query() {
  const matchups = await prisma.scoutMatchup.findMany({
    where: {
      week: '2025-W18'
    },
    take: 2,
    include: {
      registrationTx: true
    }
  });
  prettyPrint(matchups);
}
query();
