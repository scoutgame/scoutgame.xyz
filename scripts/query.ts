import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';
import { getCurrentWeek } from '@packages/dates/utils';

async function query() {
  const result = await prisma.githubRepo.count({
    where: {
      deletedAt: null
    }
  });
  prettyPrint(result);
}

query();
