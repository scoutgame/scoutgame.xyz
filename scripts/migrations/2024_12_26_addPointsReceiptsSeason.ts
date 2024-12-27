import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';

async function addPointsReceiptsSeason() {
  await prisma.pointsReceipt.updateMany({
    data: {
      season: currentSeason
    }
  });
}

addPointsReceiptsSeason().then(() => {
  log.info('Done');
});