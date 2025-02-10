import { prisma } from '@charmverse/core/prisma-client';
import { mockBuilder } from '@packages/testing/database';

import { completeQuests } from '../completeQuests';
import { questsRecord } from '../questRecords';

describe('completeQuests', () => {
  it('should complete a resettable and non-resettable quest', async () => {
    const builder = await mockBuilder();
    await completeQuests(builder.id, ['contribute-celo-repo', 'follow-x-account']);

    const quests = await prisma.scoutSocialQuest.findMany({
      where: {
        userId: builder.id
      }
    });

    const scout = await prisma.scout.findUniqueOrThrow({
      where: {
        id: builder.id
      },
      select: {
        currentBalance: true
      }
    });

    const points = await prisma.pointsReceipt.findMany({
      where: {
        recipientId: builder.id,
        event: {
          scoutSocialQuestId: {
            in: quests.map((q) => q.id)
          },
          type: 'social_quest'
        }
      }
    });

    expect(quests.length).toBe(2);

    expect(points.length).toBe(2);

    expect(scout.currentBalance).toBe(
      questsRecord['contribute-celo-repo'].points + questsRecord['follow-x-account'].points
    );
  });

  it('should not complete a non resettable quest across seasons', async () => {
    const builder = await mockBuilder();
    const previousSeason = '2024-W42';
    const newSeason = '2025-W02';

    await completeQuests(builder.id, ['follow-x-account'], true, previousSeason);
    await completeQuests(builder.id, ['follow-x-account'], true, newSeason);

    const socialQuest = await prisma.scoutSocialQuest.findFirstOrThrow({
      where: {
        userId: builder.id,
        type: 'follow-x-account'
      }
    });

    expect(socialQuest.season).toBe(previousSeason);

    const user = await prisma.scout.findUniqueOrThrow({
      where: {
        id: builder.id
      },
      select: {
        currentBalance: true
      }
    });

    expect(user.currentBalance).toBe(questsRecord['follow-x-account'].points);
  });

  it('should complete a resettable quest across seasons', async () => {
    const builder = await mockBuilder();
    const previousSeason = '2024-W42';
    const newSeason = '2025-W02';

    await completeQuests(builder.id, ['contribute-celo-repo'], true, previousSeason);
    await completeQuests(builder.id, ['contribute-celo-repo'], true, newSeason);

    const socialQuests = await prisma.scoutSocialQuest.findMany({
      where: {
        userId: builder.id,
        type: 'contribute-celo-repo'
      }
    });

    const user = await prisma.scout.findUniqueOrThrow({
      where: {
        id: builder.id
      },
      select: {
        currentBalance: true
      }
    });

    expect(socialQuests.length).toBe(2);
    expect(socialQuests.map((q) => q.season).sort()).toEqual([previousSeason, newSeason].sort());
    expect(user.currentBalance).toBe(questsRecord['contribute-celo-repo'].points * 2);
  });
});
