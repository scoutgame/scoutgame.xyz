import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';
import { recordNftPurchaseQuests } from '@packages/scoutgame/builderNfts/recordNftPurchaseQuests';

async function recordNftPurchaseQuestsForScouts() {
  const scouts = await prisma.scout.findMany({
    where: {
      nftPurchaseEvents: {
        some: {
          builderNft: {
            season: currentSeason
          }
        }
      }
    },
    select: {
      id: true
    }
  });

  for (const scout of scouts) {
    try {
      await recordNftPurchaseQuests(scout.id);
    } catch (error) {
      log.error(`Error recording NFT purchase quests for scout ${scout.id}`, error);
    }
  }
}

recordNftPurchaseQuestsForScouts().then(() => {
  log.info('Done');
});
