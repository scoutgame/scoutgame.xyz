import type { BuilderEvent, NFTPurchaseEvent } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { mockBuilder, mockScout, mockBuilderNft, mockNFTPurchaseEvent } from '@packages/testing/database';
import { randomLargeInt, randomWalletAddress } from '@packages/testing/generators';
import { createReferralEvent } from '@packages/users/referrals/createReferralEvent';
import { v4 } from 'uuid';

jest.unstable_mockModule('../../protocol/clients/getStarterNFTClient', () => ({
  getStarterNFTReadonlyClient: () => ({
    getTokenIdForBuilder: () => Promise.resolve(randomLargeInt()),
    registerBuilderToken: jest.fn(),
    getTokenPurchasePrice: () => Promise.resolve(randomLargeInt())
  })
}));

jest.unstable_mockModule('../../protocol/clients/getNFTClient', () => ({
  getNFTReadonlyClient: () => ({
    getTokenIdForBuilder: () => Promise.resolve(randomLargeInt()),
    registerBuilderToken: jest.fn(),
    getTokenPurchasePrice: () => Promise.resolve(randomLargeInt()),
    balanceOf: () => Promise.resolve(randomLargeInt())
  })
}));

jest.unstable_mockModule('../refreshBuilderNftPrice', () => ({
  refreshBuilderNftPrice: jest.fn()
}));

const { recordNftMint } = await import('../recordNftMint');
const { refreshBuilderNftPrice } = await import('../refreshBuilderNftPrice');

describe('recordNftMint', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const season = '2024-W41';

  it('should record a new NFT mint', async () => {
    const builder = await mockBuilder();
    const mockWallet = randomWalletAddress().toLowerCase();
    const scout = await mockScout({ wallets: [mockWallet] });

    const builderNft = await mockBuilderNft({ builderId: builder.id, season });

    const amount = 10;
    const mintTxHash = `0x123${Math.random().toString().replace('.', '')}`;

    await recordNftMint({
      builderNftId: builderNft.id,
      season,
      amount,
      mintTxHash,
      pointsValue: 100,
      recipientAddress: mockWallet,
      paidWithPoints: true,
      mintTxLogIndex: 0
    });

    const builderEvent = await prisma.builderEvent.findFirstOrThrow({
      where: {
        nftPurchaseEvent: {
          builderNftId: builderNft.id
        }
      },
      include: {
        nftPurchaseEvent: true
      }
    });

    expect(builderEvent).toMatchObject<BuilderEvent & { nftPurchaseEvent: NFTPurchaseEvent }>({
      bonusPartner: null,
      createdAt: expect.any(Date),
      builderId: builder.id,
      dailyClaimEventId: null,
      dailyClaimStreakEventId: null,
      description: null,
      gemsPayoutEventId: null,
      githubEventId: null,
      id: expect.any(String),
      nftPurchaseEventId: expect.any(String),
      scoutSocialQuestId: null,
      type: 'nft_purchase',
      season: builderNft.season,
      week: expect.any(String),
      weeklyClaimId: null,
      nftPurchaseEvent: {
        builderNftId: builderNft.id,
        createdAt: expect.any(Date),
        id: expect.any(String),
        paidInPoints: true,
        pointsValue: 100,
        tokensPurchased: amount,
        txHash: mintTxHash,
        walletAddress: mockWallet,
        senderWalletAddress: null,
        txLogIndex: 0
      },
      onchainAchievementId: null
    });

    const builderStats = await prisma.userSeasonStats.findUniqueOrThrow({
      where: {
        userId_season: {
          userId: builder.id,
          season: builderNft.season
        }
      }
    });

    expect(builderStats?.nftsSold).toBe(amount);
    expect(builderStats?.nftOwners).toBe(1);

    const scoutStats = await prisma.userSeasonStats.findUniqueOrThrow({
      where: {
        userId_season: {
          userId: scout.id,
          season: builderNft.season
        }
      }
    });

    expect(scoutStats?.nftsPurchased).toBe(amount);

    expect(refreshBuilderNftPrice).toHaveBeenCalledWith({
      builderId: builder.id,
      season: builderNft.season
    });
  });

  it.skip('should skip mixpanel if this flag is provided', async () => {
    const builder = await mockBuilder();
    const mockWallet = randomWalletAddress().toLowerCase();
    const scout = await mockScout({ wallets: [mockWallet] });
    const builderNft = await mockBuilderNft({ builderId: builder.id, season });

    const amount = 10;

    await recordNftMint({
      builderNftId: builderNft.id,
      season,
      amount,
      mintTxHash: `0x123${Math.random().toString()}`,
      pointsValue: 100,
      recipientAddress: mockWallet,
      paidWithPoints: true,
      skipMixpanel: true,
      mintTxLogIndex: 0
    });
  });

  it('should skip price refresh if this flag is provided', async () => {
    const builder = await mockBuilder();
    const mockWallet = randomWalletAddress().toLowerCase();
    const scout = await mockScout({ wallets: [mockWallet] });
    const builderNft = await mockBuilderNft({ builderId: builder.id, season });

    const amount = 10;

    await recordNftMint({
      builderNftId: builderNft.id,
      season,
      amount,
      mintTxHash: `0x123${Math.random().toString()}`,
      pointsValue: 100,
      recipientAddress: mockWallet,
      paidWithPoints: true,
      skipPriceRefresh: true,
      mintTxLogIndex: 0
    });

    expect(refreshBuilderNftPrice).not.toHaveBeenCalled();
  });

  it('should record a completed referral if the scout has a referral code', async () => {
    const referrer = await mockScout();
    const mockWallet = randomWalletAddress().toLowerCase();
    const referee = await mockScout({ wallets: [mockWallet] });

    await prisma.scoutEmailVerification.create({
      data: {
        scoutId: referee.id,
        completedAt: new Date(),
        email: 'test@test.com',
        code: v4()
      }
    });

    const builder = await mockBuilder();
    const builderNft = await mockBuilderNft({ builderId: builder.id, season, nftType: 'default' });

    await mockNFTPurchaseEvent({
      builderId: builder.id,
      scoutId: referee.id,
      nftType: 'default',
      season
    });

    await createReferralEvent(referrer.referralCode, referee.id);

    await recordNftMint({
      builderNftId: builderNft.id,
      amount: 1,
      mintTxHash: `0x123${Math.random().toString()}`,
      pointsValue: 100,
      season,
      recipientAddress: mockWallet,
      paidWithPoints: true,
      mintTxLogIndex: 0
    });

    const referrerAfterReferralBonus = await prisma.referralCodeEvent.findFirstOrThrow({
      where: {
        refereeId: referee.id
      }
    });

    expect(referrerAfterReferralBonus.completedAt).not.toBeNull();
  });
});
