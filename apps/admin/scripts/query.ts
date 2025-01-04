import { getLastWeek } from '@packages/scoutgame/dates/utils';
import { prisma } from '@charmverse/core/prisma-client';
async function query() {
  console.log(
    await prisma.scout.findFirst({
      where: {
        path: ''
      }
    })
  );
}

query();
