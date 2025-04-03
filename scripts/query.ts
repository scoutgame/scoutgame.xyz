import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';
import { getCurrentWeek } from '@packages/dates/utils';
import { getCurrentSeasonStart } from '@packages/dates/utils';

async function query() {
<<<<<<< HEAD
  const result = await prisma.scout.findFirst({
    where: {
      path: 'klin-hast'
    },
  });
=======
  const result = await prisma.scoutMatchup.deleteMany({});
>>>>>>> 8194ae0c3cab92c14b886e34b629a84ed3ac4449
  prettyPrint(result);
}

query();
