import type { BuilderEvent, NFTPurchaseEvent, ScoutNft, ScoutWallet } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { mockBuilder, mockScout, mockBuilderNft } from '@packages/testing/database';
import { randomLargeInt, randomWalletAddress } from '@packages/testing/generators';
import { referralBonusPoints } from '@packages/users/constants';
import { createReferralEvent } from '@packages/users/referrals/createReferralEvent';
import { updateReferralUsers } from '@packages/users/referrals/updateReferralUsers';
import { v4 } from 'uuid';
import type { Address } from 'viem';

jest.unstable_mockModule('../clients/preseason02/getPreSeasonTwoBuilderNftContractMinterClient', () => ({
  getPreSeasonTwoBuilderNftContractMinterClient: () => ({
    getTokenIdForBuilder: () => Promise.resolve(randomLargeInt()),
    registerBuilderToken: jest.fn(),
    getTokenPurchasePrice: () => Promise.resolve(randomLargeInt())
  })
}));

const amount = 10;

jest.unstable_mockModule('../clients/preseason02/getPreSeasonTwoBuilderNftContractReadonlyClient', () => ({
  getPreSeasonTwoBuilderNftContractReadonlyClient: () => ({
    getTokenIdForBuilder: () => Promise.resolve(randomLargeInt()),
    registerBuilderToken: jest.fn(),
    getTokenPurchasePrice: () => Promise.resolve(randomLargeInt()),
    balanceOf: () => Promise.resolve(amount)
  })
}));

jest.unstable_mockModule('../refreshBuilderNftPrice', () => ({
  refreshBuilderNftPrice: jest.fn()
}));

const { recordNftTransfer } = await import('../recordNftTransfer');
const { refreshScoutNftBalance } = await import('../refreshScoutNftBalance');

describe('recordNftTransfer', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const season = '2025-W02';

  it('should record a new NFT transfer, and create an account if the wallet does not exist in our system', async () => {
    const builder = await mockBuilder();

    const mockRecipientWallet = randomWalletAddress().toLowerCase() as Address;
    const mockSenderWallet = randomWalletAddress().toLowerCase() as Address;

    const scout = await mockScout({ wallets: [mockSenderWallet] });

    const builderNft = await mockBuilderNft({ builderId: builder.id, season });

    const transferTxHash = `0x123${Math.random().toString().replace('.', '')}`;

    const existingMockRecipientWalletAccount = await prisma.user.findFirst({
      where: {
        wallets: {
          some: {
            address: mockRecipientWallet
          }
        }
      }
    });

    expect(existingMockRecipientWalletAccount).toBeNull();

    await recordNftTransfer({
      contractAddress: builderNft.contractAddress as Address,
      amount,
      txHash: transferTxHash,
      from: mockSenderWallet,
      to: mockRecipientWallet,
      sentAt: new Date(),
      scoutId: scout.id,
      tokenId: builderNft.tokenId
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
        paidInPoints: false,
        pointsValue: 0,
        scoutId: expect.any(String),
        tokensPurchased: amount,
        txHash: transferTxHash,
        walletAddress: mockRecipientWallet,
        senderWalletAddress: mockSenderWallet
      }
    });

    // Make sure the recipient wallet was created
    await expect(
      prisma.scoutWallet.findFirstOrThrow({
        where: {
          address: mockRecipientWallet
        }
      })
    ).resolves.toBeDefined();

    const recipientScoutNfts = await prisma.scoutNft.findFirstOrThrow({
      where: {
        walletAddress: mockRecipientWallet,
        builderNftId: builderNft.id
      }
    });

    expect(recipientScoutNfts).toMatchObject<ScoutNft>({
      id: expect.any(String),
      builderNftId: builderNft.id,
      walletAddress: mockRecipientWallet,
      balance: amount,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date)
    });
  });
});
