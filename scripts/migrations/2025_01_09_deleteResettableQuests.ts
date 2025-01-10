import { prisma } from '@charmverse/core/prisma-client';
import { nonResettableQuestTypes } from "@packages/scoutgame/src/quests/questRecords";
import { getCurrentSeasonStart } from '@packages/dates/src/utils';

async function deleteResettableQuests() {
  const currentSeason = getCurrentSeasonStart();
  const {count} = await prisma.scoutSocialQuest.deleteMany({
    where: {
      event: null,
      season: currentSeason,
      type: {
        in: nonResettableQuestTypes
      }
    }
  })
  console.log(`Deleted ${count} non resettable quest types for current season without events`)
}

deleteResettableQuests();