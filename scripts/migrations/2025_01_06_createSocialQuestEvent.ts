import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/scoutgame/dates/utils';
import { questsRecord } from '@packages/scoutgame/quests/questRecords';

async function createNonResettableSocialQuests() {
  const nonResettableQuests = Object.entries(questsRecord).filter(([_, q]) => !q.resettable);
  const scouts = await prisma.scout.findMany({
    where: {
      deletedAt: null,
      onboardedAt: {
        not: null
      }
    }
  });
  const seasonStart = getCurrentSeasonStart();
  const totalScouts = scouts.length;
  let completedScouts = 0

  for (const scout of scouts) {
    try {
      await prisma.scoutSocialQuest.createMany({
        data: nonResettableQuests.map(([type]) => ({
          type,
          userId: scout.id,
          season: seasonStart
        }))
      });
      console.log(`${++completedScouts}/${totalScouts}`);
    } catch (error) {
      console.error('Error creating social quest event', { error, scoutId: scout.id });
    }
  }
}

async function addSeasonToSocialQuests() {
  await prisma.scoutSocialQuest.updateMany({
    where: {
      event: {
        season: '2024-W41'
      }
    },
    data: {
      season: '2024-W41'
    }
  });

  const currentSeason = getCurrentSeasonStart();

  await prisma.scoutSocialQuest.updateMany({
    where: {
      event: {
        season: currentSeason
      }
    },
    data: {
      season: currentSeason
    }
  });
}

async function backfillNonResettableSocialQuests() {
  const builderSocialQuestEventsRecord: Record<string, string[]> = {}
  const socialQuestBuilderEvents = await prisma.builderEvent.findMany({
    where: {
      type: "social_quest",
      scoutSocialQuestId: null,
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      builderId: true,
      pointsReceipts: {
        select: {
          season: true,
          value: true
        }
      }
    }
  })
  const totalEvents = socialQuestBuilderEvents.length;
  let currentEvent = 0;

  for (const event of socialQuestBuilderEvents) {
    try {
      const builderRecord = builderSocialQuestEventsRecord[event.builderId] ?? []
      const hasCompletedXQuest = builderRecord.includes('follow-x-account');
      const hasCompletedTelegramQuest = builderRecord.includes('share-x-telegram');
      if (!hasCompletedXQuest) {
        await prisma.scoutSocialQuest.create({
          data: {
            type: 'follow-x-account',
            userId: event.builderId,
            season: event.pointsReceipts[0].season,
          }
        })
      } else if (!hasCompletedTelegramQuest) {
        await prisma.scoutSocialQuest.create({
          data: {
            type: 'share-x-telegram',
            userId: event.builderId,
            season: event.pointsReceipts[0].season,
          }
        })
      } else {
        console.log('Builder has completed both quests', { builderId: event.builderId });
      }
      console.log(`Completed ${++currentEvent} / ${totalEvents}`)
    } catch (err) {
      console.log(`Something went wrong`, err)
    }
  }
}

createNonResettableSocialQuests();
addSeasonToSocialQuests();
backfillNonResettableSocialQuests();