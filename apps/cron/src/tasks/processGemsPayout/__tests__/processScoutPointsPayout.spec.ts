import { prisma } from '@charmverse/core/prisma-client';
import { calculateEarnableScoutPointsForRank } from '@packages/scoutgame/points/calculatePoints';
import { defaultBuilderPool, defaultScoutPool } from '@packages/scoutgame/points/divideTokensBetweenBuilderAndHolders';
import { mockBuilder, mockBuilderNft, mockNFTPurchaseEvent, mockScout } from '@packages/testing/database';

import { processScoutPointsPayout } from '../processScoutPointsPayout';

describe('processScoutPointsPayout', () => {
  it('should not create gems payout event, points receipt and builder event for a builder with no NFT purchases', async () => {
    const builder = await mockBuilder();
    const scout1 = await mockScout();
    const scout2 = await mockScout();
    const rank = 1;
    const gemsCollected = 10;
    const mockSeason = '2025-W02';
    const week = mockSeason;

    await mockBuilderNft({ builderId: builder.id, season: mockSeason });
    await processScoutPointsPayout({
      builderId: builder.id,
      rank,
      gemsCollected,
      week,
      season: mockSeason,
      weeklyAllocatedPoints: 1e5
    });

    const gemsPayoutEvent = await prisma.gemsPayoutEvent.findFirst({
      where: {
        builderId: builder.id,
        week
      }
    });

    expect(gemsPayoutEvent).toBeNull();

    const builderEvent = await prisma.builderEvent.findFirst({
      where: {
        builderId: builder.id,
        type: 'gems_payout',
        week
      }
    });

    expect(builderEvent).toBeNull();

    const pointsReceipt = await prisma.pointsReceipt.findFirst({
      where: {
        recipientId: builder.id
      }
    });

    expect(pointsReceipt).toBeNull();

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        type: 'points',
        recipientType: 'builder'
      }
    });
    expect(builderActivities).toBe(0);

    const scout1Activities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout1.id,
        type: 'points',
        recipientType: 'scout'
      }
    });
    expect(scout1Activities).toBe(0);

    const scout2Activities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout2.id,
        type: 'points',
        recipientType: 'scout'
      }
    });
    expect(scout2Activities).toBe(0);
  });

  it('should distribute points correctly among NFT holders and builder, respecting scout builder splits, and proportionally to NFTs owned', async () => {
    const builder = await mockBuilder();
    const expectedScoutRewardsPool = 0.7;
    const rank = 1;
    const gemsCollected = 10;
    const mockSeason = '2025-W02';
    const week = mockSeason;

    const builderNft = await mockBuilderNft({ builderId: builder.id, season: mockSeason });

    const scout1 = await mockScout();
    const scout2 = await mockScout();

    // Scout 1 has 3 NFTs, scout 2 has 7 NFTs
    const events = await Promise.all([
      mockNFTPurchaseEvent({
        builderId: builder.id,
        scoutId: scout1.id,
        points: 0,
        tokensPurchased: 2,
        week,
        season: mockSeason
      }),
      mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout1.id, points: 0, week, season: mockSeason }),
      mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout2.id, points: 0, week, season: mockSeason }),
      mockNFTPurchaseEvent({
        builderId: builder.id,
        scoutId: scout2.id,
        points: 0,
        tokensPurchased: 6,
        week,
        season: mockSeason
      })
    ]);

    const totalPoints = Math.floor(calculateEarnableScoutPointsForRank({ weeklyAllocatedPoints: 1e5, rank }));

    await prisma.pointsReceipt.deleteMany({
      where: {
        recipientId: {
          in: [builder.id, scout1.id, scout2.id]
        }
      }
    });

    await processScoutPointsPayout({
      builderId: builder.id,
      rank,
      gemsCollected,
      week,
      season: mockSeason,
      weeklyAllocatedPoints: 1e5
    });
    const builderPointReceipt = await prisma.pointsReceipt.findFirstOrThrow({
      where: {
        recipientId: builder.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    expect(Math.floor(builderPointReceipt.value)).toEqual(Math.floor((defaultBuilderPool / 100) * totalPoints));

    const builderStats = await getStats({ userId: builder.id, season: mockSeason });
    expect(builderStats.season?.pointsEarnedAsBuilder).toBe(builderPointReceipt.value);
    expect(builderStats.allTime?.pointsEarnedAsBuilder).toBe(builderPointReceipt.value);

    const scout1PointReceipt = await prisma.pointsReceipt.findFirstOrThrow({
      where: {
        recipientId: scout1.id
      }
    });

    // 3 is the # of tokens purchased by scout 1 and 10 is the total
    expect(Math.floor(scout1PointReceipt.value)).toEqual(Math.floor((defaultScoutPool / 100) * totalPoints * (3 / 10)));

    const scout1Stats = await getStats({ userId: scout1.id, season: mockSeason });
    expect(scout1Stats.season?.pointsEarnedAsScout).toBe(scout1PointReceipt.value);
    expect(scout1Stats.allTime?.pointsEarnedAsScout).toBe(scout1PointReceipt.value);

    const scout2PointReceipt = await prisma.pointsReceipt.findFirstOrThrow({
      where: {
        recipientId: scout2.id
      }
    });

    // 7 is the # of tokens purchased by scout 2
    expect(Math.floor(scout2PointReceipt.value)).toEqual(Math.floor((defaultScoutPool / 100) * (7 / 10) * totalPoints));

    const scout2Stats = await getStats({ userId: scout2.id, season: mockSeason });
    expect(scout2Stats.season?.pointsEarnedAsScout).toBe(scout2PointReceipt.value);
    expect(scout2Stats.allTime?.pointsEarnedAsScout).toBe(scout2PointReceipt.value);

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        type: 'points',
        recipientType: 'builder',
        pointsReceiptId: builderPointReceipt.id
      }
    });
    expect(Math.floor(builderPointReceipt.value)).toEqual(Math.floor((defaultBuilderPool / 100) * totalPoints));

    expect(builderActivities).toBe(1);

    const scout1Activities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout1.id,
        type: 'points',
        recipientType: 'scout',
        pointsReceiptId: scout1PointReceipt.id
      }
    });

    expect(scout1Activities).toBe(1);

    const scout2Activities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout2.id,
        type: 'points',
        recipientType: 'scout',
        pointsReceiptId: scout2PointReceipt.id
      }
    });

    expect(scout2Activities).toBe(1);
  });

  it('should not create gems payout, builder event and points receipt if gems payout event already exists', async () => {
    const builder = await mockBuilder();
    const rank = 1;
    const gemsCollected = 10;

    const mockSeason = '2025-W02';
    const week = mockSeason;

    const scout1 = await mockScout();
    const scout2 = await mockScout();

    const builderNft = await mockBuilderNft({ builderId: builder.id, season: mockSeason });

    // Scout 1 has 3 NFTs, scout 2 has 7 NFTs
    const events = await Promise.all([
      await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout1.id, points: 0, week, season: mockSeason }),
      await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout2.id, points: 0, week, season: mockSeason })
    ]);

    const weeklyAllocatedPoints = 1e5;

    await processScoutPointsPayout({
      builderId: builder.id,
      rank,
      gemsCollected,
      week,
      season: mockSeason,
      weeklyAllocatedPoints
    });
    await processScoutPointsPayout({
      builderId: builder.id,
      rank,
      gemsCollected,
      week,
      season: mockSeason,
      weeklyAllocatedPoints
    });
    await processScoutPointsPayout({
      builderId: builder.id,
      rank,
      gemsCollected,
      week,
      season: mockSeason,
      weeklyAllocatedPoints
    });

    const gemsPayoutEventCount = await prisma.gemsPayoutEvent.count({
      where: {
        builderId: builder.id,
        week
      }
    });

    expect(gemsPayoutEventCount).toBe(1);

    const builderEventCount = await prisma.builderEvent.count({
      where: {
        builderId: builder.id,
        type: 'gems_payout',
        week
      }
    });

    expect(builderEventCount).toBe(1);

    const builderPointsReceiptCount = await prisma.pointsReceipt.count({
      where: {
        recipientId: builder.id,
        event: {
          type: 'gems_payout'
        }
      }
    });

    expect(builderPointsReceiptCount).toBe(1);

    const scout1PointsReceiptCount = await prisma.pointsReceipt.count({
      where: {
        recipientId: scout1.id
      }
    });

    expect(scout1PointsReceiptCount).toBe(1);

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        type: 'points',
        recipientType: 'builder'
      }
    });

    expect(builderActivities).toBe(1);

    const scout1Activities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout1.id,
        type: 'points',
        recipientType: 'scout'
      }
    });

    expect(scout1Activities).toBe(1);

    const scout2Activities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout2.id,
        type: 'points',
        recipientType: 'scout'
      }
    });

    expect(scout2Activities).toBe(1);
  });
});

async function getStats({ userId, season }: { userId: string; season: string }) {
  const userSeasonStats = await prisma.userSeasonStats.findFirstOrThrow({
    where: {
      userId,
      season
    }
  });
  const allTimeStats = await prisma.userAllTimeStats.findFirst({
    where: {
      userId
    }
  });

  return { season: userSeasonStats, allTime: allTimeStats };
}
