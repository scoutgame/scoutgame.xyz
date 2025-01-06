import { InvalidInputError } from '@charmverse/core/errors';
import type { PointsReceipt, Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { v4 as uuid } from 'uuid';

import { getCurrentSeasonStart } from '../../dates/utils';
import { mockScout } from '../../testing/database';
import type { PointStats } from '../getPointStatsFromHistory';
import { getPointStatsFromHistory } from '../getPointStatsFromHistory';

describe('getPointStatsFromHistory', () => {
  let user: Scout;

  const season = getCurrentSeasonStart();

  beforeAll(async () => {
    user = await mockScout({ path: `user-${uuid()}` });
  });

  it('should return point stats only when valid UUID is provided', async () => {
    const stats = await getPointStatsFromHistory({ userIdOrPath: user.id, season });
    expect(stats).toMatchObject({
      userId: user.id,
      pointsSpent: expect.any(Number),
      pointsReceivedAsScout: expect.any(Number),
      pointsReceivedAsBuilder: expect.any(Number),
      bonusPointsReceived: expect.any(Number),
      claimedPoints: expect.any(Number),
      unclaimedPoints: expect.any(Number),
      balance: expect.any(Number)
    });
  });

  it('should only return point stats from the provided season', async () => {
    const mockUser = await mockScout();

    const previousSeason = '2024-W41';

    const currentSeason = '2024-W02';

    const previousSeasonEvent = await prisma.builderEvent.create({
      data: {
        season: previousSeason,
        week: '2024-W44',
        builderId: mockUser.id,
        type: 'misc_event',
        description: 'Test event'
      }
    });

    const previousSeasonPointsReceivedReceipt = await prisma.pointsReceipt.create({
      data: {
        value: 100,
        season: previousSeason,
        recipientId: mockUser.id,
        eventId: previousSeasonEvent.id,
        claimedAt: new Date()
      }
    });

    const previousSeasonPointsSpentReceipt = await prisma.pointsReceipt.create({
      data: {
        value: 50,
        season: previousSeason,
        senderId: mockUser.id,
        eventId: previousSeasonEvent.id,
        claimedAt: new Date()
      }
    });

    const previousSeasonGemPayoutEvent = await prisma.builderEvent.create({
      data: {
        season: previousSeason,
        week: '2024-W44',
        builderId: mockUser.id,
        type: 'gems_payout',
        description: 'Test event',
        pointsReceipts: {
          create: {
            season: previousSeason,
            value: 120,
            recipientId: mockUser.id,
            claimedAt: new Date()
          }
        }
      }
    });

    const currentSeasonEvent = await prisma.builderEvent.create({
      data: {
        season: currentSeason,
        week: '2024-W03',
        builderId: mockUser.id,
        type: 'misc_event',
        description: 'Test event'
      }
    });

    const currentSeasonPointsReceivedReceipt = await prisma.pointsReceipt.create({
      data: {
        value: 210,
        season: currentSeason,
        recipientId: mockUser.id,
        eventId: currentSeasonEvent.id,
        claimedAt: new Date()
      }
    });

    const currentSeasonPointsSpentReceipt = await prisma.pointsReceipt.create({
      data: {
        value: 80,
        season: currentSeason,
        senderId: mockUser.id,
        eventId: currentSeasonEvent.id,
        claimedAt: new Date()
      }
    });

    const currentSeasonGemPayoutEvent = await prisma.builderEvent.create({
      data: {
        season: currentSeason,
        week: '2024-W03',
        builderId: mockUser.id,
        type: 'gems_payout',
        description: 'Test event',
        pointsReceipts: {
          create: {
            season: currentSeason,
            value: 40,
            recipientId: mockUser.id,
            claimedAt: new Date()
          }
        }
      }
    });

    const previousSeasonStats = await getPointStatsFromHistory({ userIdOrPath: mockUser.id, season: previousSeason });

    expect(previousSeasonStats).toMatchObject<PointStats>({
      userId: mockUser.id,
      pointsSpent: 50,
      balance: 170,
      pointsReceivedAsBuilder: 0,
      pointsReceivedAsScout: 0,
      bonusPointsReceived: 100,
      claimedPoints: 220,
      unclaimedPoints: 0
    });

    const currentSeasonStats = await getPointStatsFromHistory({ userIdOrPath: mockUser.id, season: currentSeason });

    expect(currentSeasonStats).toMatchObject<PointStats>({
      userId: mockUser.id,
      pointsSpent: 80,
      balance: 170,
      pointsReceivedAsBuilder: 0,
      pointsReceivedAsScout: 0,
      bonusPointsReceived: 210,
      claimedPoints: 250,
      unclaimedPoints: 0
    });
  });

  // @TODO: Redo the find by username logic
  it('should return point stats when valid username is provided', async () => {
    const stats = await getPointStatsFromHistory({ userIdOrPath: user.path!, season });
    expect(stats).toMatchObject({
      userId: user.id,
      pointsSpent: expect.any(Number),
      pointsReceivedAsScout: expect.any(Number),
      pointsReceivedAsBuilder: expect.any(Number),
      bonusPointsReceived: expect.any(Number),
      claimedPoints: expect.any(Number),
      unclaimedPoints: expect.any(Number),
      balance: expect.any(Number)
    });
  });

  it('should return detailed point stats, with a balance calculated based on points claimed minus claimed points (unclaimed points not in balance), and only take points stats from the provided season', async () => {
    const pointsSpentRecords = [{ value: 100 }, { value: 50 }];

    const pointsSpent = 100 + 50;

    const pointsReceivedAsBuilderRecords = [
      { value: 80, claimedAt: new Date() },
      { value: 90, claimedAt: new Date() }
    ];

    const pointsReceivedAsScoutRecords = [{ value: 120 }, { value: 240, claimedAt: new Date() }];

    const bonusPointsReceivedRecords = [{ value: 40 }];

    const allPointsReceivedRecords = [
      ...pointsReceivedAsBuilderRecords,
      ...pointsReceivedAsScoutRecords,
      ...bonusPointsReceivedRecords
    ];

    const claimedPoints = allPointsReceivedRecords.reduce((acc, record) => {
      if ((record as Pick<PointsReceipt, 'claimedAt' | 'value'>).claimedAt) {
        return acc + record.value;
      }
      return acc;
    }, 0);

    jest.spyOn(prisma.pointsReceipt, 'findMany').mockResolvedValueOnce(pointsSpentRecords as PointsReceipt[]);

    jest
      .spyOn(prisma.pointsReceipt, 'findMany')
      .mockResolvedValueOnce(pointsReceivedAsBuilderRecords as PointsReceipt[]);

    jest.spyOn(prisma.pointsReceipt, 'findMany').mockResolvedValueOnce(pointsReceivedAsScoutRecords as PointsReceipt[]);

    jest.spyOn(prisma.pointsReceipt, 'findMany').mockResolvedValueOnce(bonusPointsReceivedRecords as PointsReceipt[]);

    jest.spyOn(prisma.pointsReceipt, 'findMany').mockResolvedValueOnce(allPointsReceivedRecords as PointsReceipt[]);

    const pointStats = await getPointStatsFromHistory({ userIdOrPath: user.id, season });

    // Sanity check that the points add up
    expect(pointStats.claimedPoints + pointStats.unclaimedPoints).toEqual(
      pointStats.pointsReceivedAsBuilder + pointStats.pointsReceivedAsScout + pointStats.bonusPointsReceived
    );

    expect(pointStats).toEqual<PointStats>({
      balance: claimedPoints - pointsSpent,
      bonusPointsReceived: 40,
      claimedPoints,
      pointsReceivedAsBuilder: 170,
      pointsReceivedAsScout: 360,
      pointsSpent: 150,
      unclaimedPoints: 160,
      userId: user.id
    });
  });

  it('should throw InvalidInputError when userIdOrUsername is empty', async () => {
    await expect(getPointStatsFromHistory({ userIdOrPath: '', season })).rejects.toThrow(InvalidInputError);
  });

  it('should throw an error when userIdOrUsername is invalid UUID and does not exist as a username', async () => {
    const nonExistentUserId = uuid();
    await expect(getPointStatsFromHistory({ userIdOrPath: nonExistentUserId, season })).rejects.toThrow();
  });

  it.skip('should throw an assertion error if point records for individual categories do not match the full list of point records', async () => {
    const pointsSpentRecords = [{ value: 100 }, { value: 50 }];
    const pointsReceivedAsBuilderRecords = [{ value: 80 }, { value: 90 }];
    const pointsReceivedAsScoutRecords = [{ value: 120 }];
    const bonusPointsReceivedRecords = [{ value: 40 }];
    const allPointsReceivedRecords = [
      ...pointsReceivedAsBuilderRecords,
      // Scout points are missing, so we expected an error
      // ...pointsReceivedAsScoutRecords,
      ...bonusPointsReceivedRecords
    ];

    jest.spyOn(prisma.pointsReceipt, 'findMany').mockResolvedValueOnce(pointsSpentRecords as PointsReceipt[]); // Mismatch points
    //
    jest
      .spyOn(prisma.pointsReceipt, 'findMany')
      .mockResolvedValueOnce(pointsReceivedAsBuilderRecords as PointsReceipt[]); // Mismatch points

    jest.spyOn(prisma.pointsReceipt, 'findMany').mockResolvedValueOnce(pointsReceivedAsScoutRecords as PointsReceipt[]); // Mismatch points

    jest.spyOn(prisma.pointsReceipt, 'findMany').mockResolvedValueOnce(bonusPointsReceivedRecords as PointsReceipt[]); // Mismatch points

    jest.spyOn(prisma.pointsReceipt, 'findMany').mockResolvedValueOnce(allPointsReceivedRecords as PointsReceipt[]); // Mismatch points
    await expect(getPointStatsFromHistory({ userIdOrPath: user.id, season })).rejects.toThrow();
  });
});
