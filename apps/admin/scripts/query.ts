import { getLastWeek } from '@packages/dates/utils';
import { GET } from '../app/api/partners/moxie/route';
import { getLastWeek } from '@packages/dates/utils';
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
