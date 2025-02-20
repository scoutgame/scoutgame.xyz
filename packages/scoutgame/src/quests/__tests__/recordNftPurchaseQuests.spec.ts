import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { mockBuilder, mockBuilderNft, mockNFTPurchaseEvent, mockScout } from '@packages/testing/database';

import { recordNftPurchaseQuests } from '../recordNftPurchaseQuests';

const season = getCurrentSeasonStart();

describe('recordNftPurchaseQuests', () => {
  it('should record scout-starter-card and op quest completion for scout with 1 starter pack card', async () => {
    const [builder1, builder2] = await Promise.all([mockBuilder(), mockBuilder()]);
    await Promise.all([
      mockBuilderNft({
        builderId: builder1.id,
        season,
        nftType: 'starter_pack'
      }),
      mockBuilderNft({
        builderId: builder2.id,
        season,
        nftType: 'starter_pack'
      })
    ]);
    const scout = await mockScout();
    await mockNFTPurchaseEvent({
      scoutId: scout.id,
      builderId: builder1.id,
      nftType: 'starter_pack',
      season
    });

    await mockNFTPurchaseEvent({
      scoutId: scout.id,
      builderId: builder2.id,
      nftType: 'starter_pack',
      season
    });

    await recordNftPurchaseQuests(scout.id);

    const quest = await prisma.scoutSocialQuest.findUnique({
      where: {
        type_userId_season: {
          type: 'scout-starter-card',
          userId: scout.id,
          season
        }
      }
    });

    const opQuest = await prisma.scoutSocialQuest.findUnique({
      where: {
        type_userId_season: {
          type: 'enter-op-new-scout-competition',
          userId: scout.id,
          season
        }
      }
    });

    expect(quest).not.toBeNull();
    expect(opQuest).not.toBeNull();
  });

  it('should record scout-3-starter-cards quest completion for scout with 3 starter pack cards', async () => {
    const [builder1, builder2, builder3] = await Promise.all([mockBuilder(), mockBuilder(), mockBuilder()]);
    const builderIds = [builder1.id, builder2.id, builder3.id];
    await Promise.all(
      builderIds.map((builderId) =>
        mockBuilderNft({
          builderId,
          season,
          nftType: 'starter_pack'
        })
      )
    );
    const scout = await mockScout();
    await Promise.all(
      builderIds.map((builderId) =>
        mockNFTPurchaseEvent({
          scoutId: scout.id,
          builderId,
          nftType: 'starter_pack',
          season
        })
      )
    );

    await recordNftPurchaseQuests(scout.id);

    const quest = await prisma.scoutSocialQuest.findUnique({
      where: {
        type_userId_season: {
          type: 'scout-3-starter-cards',
          userId: scout.id,
          season
        }
      }
    });

    expect(quest).not.toBeNull();
  });

  it('should record scout-full-season-card and op quest completion for scout with 1 full season card', async () => {
    const [builder1, builder2] = await Promise.all([mockBuilder(), mockBuilder()]);
    const builderIds = [builder1.id, builder2.id];
    await Promise.all(
      builderIds.map((builderId) =>
        mockBuilderNft({
          builderId,
          season,
          nftType: 'default'
        })
      )
    );
    const scout = await mockScout();
    await Promise.all(
      builderIds.map((builderId) =>
        mockNFTPurchaseEvent({
          scoutId: scout.id,
          builderId,
          nftType: 'default',
          season
        })
      )
    );

    await recordNftPurchaseQuests(scout.id);

    const quest = await prisma.scoutSocialQuest.findUnique({
      where: {
        type_userId_season: {
          type: 'scout-full-season-card',
          userId: scout.id,
          season
        }
      }
    });

    const opQuest = await prisma.scoutSocialQuest.findUnique({
      where: {
        type_userId_season: {
          type: 'enter-op-new-scout-competition',
          userId: scout.id,
          season
        }
      }
    });

    expect(quest).not.toBeNull();
    expect(opQuest).not.toBeNull();
  });

  it('should record scout-5-builders quest completion for scout with 5 unique cards', async () => {
    const [builder1, builder2, builder3] = await Promise.all([mockBuilder(), mockBuilder(), mockBuilder()]);
    const scout = await mockScout();

    let builderIds = [builder1.id, builder2.id, builder3.id];
    await Promise.all(
      builderIds.map((builderId) =>
        mockBuilderNft({
          builderId,
          season,
          nftType: 'default'
        })
      )
    );

    await Promise.all(
      builderIds.map((builderId) =>
        mockNFTPurchaseEvent({
          scoutId: scout.id,
          builderId,
          nftType: 'default',
          season,
          tokensPurchased: 2
        })
      )
    );

    await recordNftPurchaseQuests(scout.id);

    const quest = await prisma.scoutSocialQuest.findUnique({
      where: {
        type_userId_season: {
          type: 'scout-5-builders',
          userId: scout.id,
          season
        }
      }
    });

    expect(quest).toBeNull();

    const [builder4, builder5] = await Promise.all([mockBuilder(), mockBuilder()]);
    builderIds = [builder4.id, builder5.id];
    await Promise.all(
      builderIds.map((builderId) =>
        mockBuilderNft({
          builderId,
          season,
          nftType: 'default'
        })
      )
    );
    await Promise.all(
      builderIds.map((builderId) =>
        mockNFTPurchaseEvent({
          scoutId: scout.id,
          builderId,
          nftType: 'default',
          season
        })
      )
    );

    await recordNftPurchaseQuests(scout.id);

    const updatedQuest = await prisma.scoutSocialQuest.findUnique({
      where: {
        type_userId_season: {
          type: 'scout-5-builders',
          userId: scout.id,
          season
        }
      }
    });

    expect(updatedQuest).not.toBeNull();
  });
});
