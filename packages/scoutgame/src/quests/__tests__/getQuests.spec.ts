import { prisma } from '@charmverse/core/prisma-client';
import { mockBuilder, mockBuilderNft, mockNFTPurchaseEvent, mockScout } from '@packages/testing/database';

import { completeQuests } from '../completeQuests';
import { getQuests } from '../getQuests';

describe('getQuests', () => {
  it('should return resettable quests for a user', async () => {
    const pastSeason = '2024-W42';
    const currentSeason = '2025-W02';
    const scout = await mockScout();

    await completeQuests(scout.id, ['share-scout-profile'], false, pastSeason);

    await completeQuests(scout.id, ['share-scout-profile'], false, currentSeason);

    const quests = await getQuests(scout.id, currentSeason);

    const shareScoutProfileQuest = quests.find((q) => q.type === 'share-scout-profile');

    expect(shareScoutProfileQuest?.completed).toBe(true);
  });

  it('should return non-resettable quests for a user', async () => {
    const pastSeason = '2024-W42';
    const currentSeason = '2025-W02';
    const scout = await mockScout();

    await completeQuests(scout.id, ['follow-x-account'], false, pastSeason);

    const quests = await getQuests(scout.id, currentSeason);

    const followXAccountQuest = quests.find((q) => q.type === 'follow-x-account');

    expect(followXAccountQuest?.completed).toBe(true);
  });

  it('should return correct steps for resettable quests for a user', async () => {
    const pastSeason = '2024-W42';
    const currentSeason = '2025-W02';
    const scout = await mockScout();
    const builders = await Promise.all(Array.from({ length: 2 }, () => mockBuilder()));

    await Promise.all([
      ...builders.map((b) => mockBuilderNft({ season: currentSeason, nftType: 'default', builderId: b.id })),
      ...builders.map((b) => mockBuilderNft({ season: currentSeason, nftType: 'starter_pack', builderId: b.id })),
      ...builders.map((b) => mockBuilderNft({ season: pastSeason, nftType: 'default', builderId: b.id })),
      ...builders.map((b) => mockBuilderNft({ season: pastSeason, nftType: 'starter_pack', builderId: b.id }))
    ]);

    await mockNFTPurchaseEvent({
      builderId: builders[0].id,
      scoutId: scout.id,
      season: pastSeason,
      week: pastSeason,
      nftType: 'default'
    });

    await mockNFTPurchaseEvent({
      builderId: builders[0].id,
      scoutId: scout.id,
      season: pastSeason,
      week: pastSeason,
      nftType: 'starter_pack'
    });

    await mockNFTPurchaseEvent({
      builderId: builders[0].id,
      scoutId: scout.id,
      season: currentSeason,
      week: currentSeason,
      nftType: 'default'
    });

    await mockNFTPurchaseEvent({
      builderId: builders[1].id,
      scoutId: scout.id,
      season: currentSeason,
      week: currentSeason,
      nftType: 'default'
    });

    await mockNFTPurchaseEvent({
      builderId: builders[0].id,
      scoutId: scout.id,
      season: currentSeason,
      week: currentSeason,
      nftType: 'starter_pack'
    });

    await completeQuests(scout.id, ['scout-5-builders', 'scout-full-season-card'], false, pastSeason);

    await completeQuests(scout.id, ['scout-5-builders', 'scout-3-starter-cards'], false, currentSeason);

    const quests = await getQuests(scout.id, currentSeason);

    const scoutFullSeasonCardQuest = quests.find((q) => q.type === 'scout-full-season-card');
    const scout5BuildersQuest = quests.find((q) => q.type === 'scout-5-builders');
    const scout3StarterCardsQuest = quests.find((q) => q.type === 'scout-3-starter-cards');

    expect(scoutFullSeasonCardQuest?.completed).toBe(false);
    expect(scout5BuildersQuest?.completed).toBe(true);
    // 1 for default, 1 for starter pack
    expect(scout5BuildersQuest?.completedSteps).toBe(2);
    expect(scout3StarterCardsQuest?.completed).toBe(true);
    expect(scout3StarterCardsQuest?.completedSteps).toBe(1);
  });
});
