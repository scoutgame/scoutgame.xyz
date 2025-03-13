import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';
import { getCurrentWeek } from '@packages/dates/utils';

async function query() {
  const result = await prisma.scout.findFirst({
    where: {
      displayName: 'mattcasey.eth'
    }
  });
  prettyPrint(result);
}

query();
