import { prisma } from '@charmverse/core/prisma-client';
import { mockBuilder } from '@packages/testing/database';

import { completeQuests } from '../completeQuests';
import { questsRecord } from '../questRecords';

describe('completeQuest', () => {
  it('should complete a quest', async () => {
    const builder = await mockBuilder();
    await completeQuests(builder.id, ['follow-x-account']);

    const quest = await prisma.scoutSocialQuest.findFirstOrThrow({
      where: {
        userId: builder.id,
        type: 'follow-x-account'
      }
    });

    expect(quest).not.toBeNull();

    const points = await prisma.pointsReceipt.findMany({
      where: {
        recipientId: builder.id,
        event: {
          scoutSocialQuestId: quest.id,
          type: 'social_quest'
        }
      }
    });

    expect(points.length).toBe(1);
    expect(points[0].value).toBe(questsRecord['follow-x-account'].points);

    const scout = await prisma.scout.findUniqueOrThrow({
      where: {
        id: builder.id
      },
      select: {
        currentBalance: true
      }
    });

    expect(scout.currentBalance).toBe(questsRecord['follow-x-account'].points);
  });
});
