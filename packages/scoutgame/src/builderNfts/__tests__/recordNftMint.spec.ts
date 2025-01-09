import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { mockBuilder, mockScout, mockBuilderNft } from '@packages/testing/database';
import { randomLargeInt } from '@packages/testing/generators';
import { generateRandomEthAddress } from '@packages/testing/random';
import { referralBonusPoints } from '@packages/users/constants';
import { createReferralEvent } from '@packages/users/referrals/createReferralEvent';
import { updateReferralUsers } from '@packages/users/referrals/updateReferralUsers';

jest.unstable_mockModule('../clients/builderContractMinterWriteClient', () => ({
  getBuilderContractMinterClient: () => ({
    getTokenIdForBuilder: () => Promise.resolve(randomLargeInt()),
    registerBuilderToken: jest.fn(),
    getTokenPurchasePrice: () => Promise.resolve(randomLargeInt())
  })
}));

jest.unstable_mockModule('../clients/builderContractReadClient', () => ({
  builderContractReadonlyApiClient: {
    getTokenIdForBuilder: () => Promise.resolve(randomLargeInt()),
    registerBuilderToken: jest.fn(),
    getTokenPurchasePrice: () => Promise.resolve(randomLargeInt())
  }
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
    const mockWallet = generateRandomEthAddress().toLowerCase();
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
      scoutId: scout.id,
      paidWithPoints: true
    });

    const builderEvent = await prisma.builderEvent.findFirstOrThrow({
      where: {
        nftPurchaseEvent: {
          builderNftId: builderNft.id
        }
      }
    });

    expect(builderEvent.type).toBe('nft_purchase');
    expect(builderEvent.builderId).toBe(builder.id);
    expect(builderEvent.season).toBe(builderNft.season);

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
    const mockWallet = generateRandomEthAddress().toLowerCase();
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
      scoutId: scout.id,
      paidWithPoints: true,
      skipMixpanel: true
    });
  });

  it('should skip price refresh if this flag is provided', async () => {
    const builder = await mockBuilder();
    const mockWallet = generateRandomEthAddress().toLowerCase();
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
      scoutId: scout.id,
      paidWithPoints: true,
      skipPriceRefresh: true
    });

    expect(refreshBuilderNftPrice).not.toHaveBeenCalled();
  });

  it('should create a referral bonus event if the scout has a referral code', async () => {
    const referrer = await mockScout();
    const mockWallet = generateRandomEthAddress().toLowerCase();
    const referee = await mockScout({ wallets: [mockWallet] });

    const builder = await mockBuilder();
    const builderNft = await mockBuilderNft({ builderId: builder.id, season });

    await createReferralEvent(referrer.referralCode, referee.id);

    await updateReferralUsers(referee.id);

    const referrerAfterReferral = await prisma.scout.findUniqueOrThrow({
      where: {
        id: referrer.id
      },
      select: {
        currentBalance: true
      }
    });

    await recordNftMint({
      builderNftId: builderNft.id,
      amount: 1,
      mintTxHash: `0x123${Math.random().toString()}`,
      pointsValue: 100,
      season,
      recipientAddress: mockWallet,
      scoutId: referee.id,
      paidWithPoints: true
    });

    const referrerAfterReferralBonus = await prisma.scout.findUniqueOrThrow({
      where: {
        id: referrer.id
      },
      select: {
        currentBalance: true
      }
    });

    expect(referrerAfterReferralBonus.currentBalance).toBe(referrerAfterReferral.currentBalance + referralBonusPoints);
  });

  it('should not create a referral bonus event if the referrer has been banned', async () => {
    const referrer = await mockScout({
      deletedAt: new Date()
    });
    const referee = await mockScout();

    await expect(createReferralEvent(referrer.referralCode, referee.id)).rejects.toThrow('Referrer has been banned');
  });
});
