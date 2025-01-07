import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

async function addPointsReceiptsSeason() {
  await prisma.pointsReceipt.updateMany({
    data: {
      season: getCurrentSeasonStart()
    }
  });
}

addPointsReceiptsSeason().then(() => {
  log.info('Done');
});
