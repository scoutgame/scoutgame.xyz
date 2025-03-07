import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { mockBuilder, mockBuilderNft, mockScout, mockScoutedNft } from '@packages/testing/database';
import { mockSeason } from '@packages/testing/generators';

jest.unstable_mockModule('@packages/scoutgame/notifications/sendNotifications', () => ({
  sendNotifications: jest.fn()
}));

const { sendNotifications } = await import('@packages/scoutgame/notifications/sendNotifications');

const { sendDeveloperRankChangeNotifications } = await import('../sendDeveloperRankChangeNotifications');

describe('sendDeveloperRankChangeNotifications', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should send notifications when a developer moves into top 10', async () => {
    // Create a scout who owns an NFT
    const scout = await mockScout({
      season: mockSeason,
      stats: {
        season: {
          nftsPurchased: 1,
          pointsEarnedAsBuilder: 100
        }
      }
    });

    const builder = await mockBuilder({ nftSeason: mockSeason });

    // Create an NFT for the builder and assign it to the scout
    const builderNft = await mockBuilderNft({ builderId: builder.id, season: mockSeason });
    await mockScoutedNft({ builderNftId: builderNft.id, scoutId: scout.id, season: mockSeason });

    // Mock the builders ranks record to simulate moving into top 10
    const buildersRanksRecord = {
      [builder.id]: [null, 5] // Previous rank was null, current rank is 5
    };

    // Mock sendNotifications to return 1 (success)
    (sendNotifications as unknown as jest.Mock<() => Promise<number>>).mockResolvedValue(2);

    const notificationsSent = await sendDeveloperRankChangeNotifications({
      buildersRanksRecord,
      currentSeason: mockSeason
    });

    expect(notificationsSent).toBe(2);
  });

  it('should send notifications when a developer moves out of top 10', async () => {
    // Create a scout who owns an NFT
    const scout = await mockScout({
      season: mockSeason,
      stats: {
        season: {
          nftsPurchased: 1,
          pointsEarnedAsBuilder: 100
        }
      }
    });

    const builder = await mockBuilder({ nftSeason: mockSeason });

    // Create an NFT for the builder and assign it to the scout
    const builderNft = await mockBuilderNft({ builderId: builder.id, season: mockSeason });
    await mockScoutedNft({ builderNftId: builderNft.id, scoutId: scout.id, season: mockSeason });

    // Mock the builders ranks record to simulate moving out of top 10
    const buildersRanksRecord = {
      [builder.id]: [8, 12] // Previous rank was 8, current rank is 12
    };

    // Mock sendNotifications to return 1 (success)
    (sendNotifications as unknown as jest.Mock<() => Promise<number>>).mockResolvedValue(2);

    const notificationsSent = await sendDeveloperRankChangeNotifications({
      buildersRanksRecord,
      currentSeason: mockSeason
    });

    expect(notificationsSent).toBe(2);
  });

  it('should not send notifications when rank changes but stays within top 10', async () => {
    // Create a scout who owns an NFT
    const scout = await mockScout({
      season: mockSeason,
      stats: { season: { nftsPurchased: 1, pointsEarnedAsBuilder: 100 } }
    });
    const builder = await mockBuilder({ nftSeason: mockSeason });

    // Create an NFT for the builder and assign it to the scout
    const builderNft = await mockBuilderNft({ builderId: builder.id, season: mockSeason });
    await mockScoutedNft({ builderNftId: builderNft.id, scoutId: scout.id, season: mockSeason });

    // Mock the builders ranks record to simulate rank change within top 10
    const buildersRanksRecord = {
      [builder.id]: [5, 3] // Previous rank was 5, current rank is 3
    };

    const notificationsSent = await sendDeveloperRankChangeNotifications({
      buildersRanksRecord,
      currentSeason: mockSeason
    });

    expect(notificationsSent).toBe(0);
    expect(sendNotifications).not.toHaveBeenCalled();
  });

  it('should not send notifications when rank changes but stays outside top 10', async () => {
    // Create a scout who owns an NFT
    const scout = await mockScout({
      season: mockSeason,
      stats: { season: { nftsPurchased: 1, pointsEarnedAsBuilder: 100 } }
    });
    const builder = await mockBuilder({ nftSeason: mockSeason });

    // Create an NFT for the builder and assign it to the scout
    const builderNft = await mockBuilderNft({ builderId: builder.id, season: mockSeason });
    await mockScoutedNft({ builderNftId: builderNft.id, scoutId: scout.id, season: mockSeason });

    // Mock the builders ranks record to simulate rank change outside top 10
    const buildersRanksRecord = {
      [builder.id]: [15, 20] // Previous rank was 15, current rank is 20
    };

    const notificationsSent = await sendDeveloperRankChangeNotifications({
      buildersRanksRecord,
      currentSeason: mockSeason
    });

    expect(notificationsSent).toBe(0);
    expect(sendNotifications).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully when sending notifications fails', async () => {
    // Create a scout who owns an NFT
    const scout = await mockScout({
      season: mockSeason,
      stats: { season: { nftsPurchased: 1, pointsEarnedAsBuilder: 100 } }
    });
    const builder = await mockBuilder({ nftSeason: mockSeason });

    // Create an NFT for the builder and assign it to the scout
    const builderNft = await mockBuilderNft({ builderId: builder.id, season: mockSeason });
    await mockScoutedNft({ builderNftId: builderNft.id, scoutId: scout.id, season: mockSeason });

    // Mock the builders ranks record to simulate moving into top 10
    const buildersRanksRecord = {
      [builder.id]: [null, 5] // Previous rank was null, current rank is 5
    };

    // Mock sendNotifications to throw an error
    (sendNotifications as unknown as jest.Mock<() => Promise<number>>).mockRejectedValue(
      new Error('Failed to send notification')
    );

    const notificationsSent = await sendDeveloperRankChangeNotifications({
      buildersRanksRecord,
      currentSeason: mockSeason
    });

    expect(notificationsSent).toBe(0);
    expect(sendNotifications).toHaveBeenCalled();
  });

  it('should not send notifications to scouts who do not own any NFTs', async () => {
    // Create a scout without any NFTs
    const scout = await mockScout({
      season: mockSeason,
      stats: { season: { nftsPurchased: 0, pointsEarnedAsBuilder: 0 } }
    });
    const builder = await mockBuilder({ nftSeason: mockSeason });

    // Mock the builders ranks record
    const buildersRanksRecord = {
      [builder.id]: [null, 5] // Previous rank was null, current rank is 5
    };

    const notificationsSent = await sendDeveloperRankChangeNotifications({
      buildersRanksRecord,
      currentSeason: mockSeason
    });

    expect(notificationsSent).toBe(0);
    expect(sendNotifications).not.toHaveBeenCalled();
  });

  it('should handle multiple developers moving in and out of top 10', async () => {
    // Create a scout who owns multiple NFTs
    const scout = await mockScout({
      season: mockSeason,
      stats: { season: { nftsPurchased: 2, pointsEarnedAsBuilder: 100 } }
    });
    const builder1 = await mockBuilder({ nftSeason: mockSeason });
    const builder2 = await mockBuilder({ nftSeason: mockSeason });

    // Create NFTs for both builders and assign them to the scout
    const builderNft1 = await mockBuilderNft({ builderId: builder1.id, season: mockSeason });
    const builderNft2 = await mockBuilderNft({ builderId: builder2.id, season: mockSeason });
    await mockScoutedNft({ builderNftId: builderNft1.id, scoutId: scout.id, season: mockSeason });
    await mockScoutedNft({ builderNftId: builderNft2.id, scoutId: scout.id, season: mockSeason });

    // Mock the builders ranks record to simulate multiple rank changes
    const buildersRanksRecord = {
      [builder1.id]: [null, 5], // Moving into top 10
      [builder2.id]: [8, 12] // Moving out of top 10
    };

    // Mock sendNotifications to return 1 (success)
    (sendNotifications as unknown as jest.Mock<() => Promise<number>>).mockResolvedValue(4);

    const notificationsSent = await sendDeveloperRankChangeNotifications({
      buildersRanksRecord,
      currentSeason: mockSeason
    });

    expect(notificationsSent).toBe(4);
  });
});
