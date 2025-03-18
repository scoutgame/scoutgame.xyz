import type { BuilderEvent, NFTPurchaseEvent, ScoutNft } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import { mockBuilder, mockBuilderNft, mockScout } from '@packages/testing/database';
import { randomLargeInt, randomWalletAddress } from '@packages/testing/generators';
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

jest.unstable_mockModule('@packages/blockchain/getPublicClient', () => ({
  getPublicClient: () => {
    return {
      getBlock: async () => {
        return {
          timestamp: 1716153600
        };
      }
    };
  }
}));

const { recordNftTransfer } = await import('../recordNftTransfer');

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
      transferSingleEvent: {
        eventName: 'TransferSingle',
        args: {
          id: BigInt(builderNft.tokenId),
          value: BigInt(amount),
          from: mockSenderWallet,
          to: mockRecipientWallet,
          operator: mockSenderWallet
        },
        transactionHash: transferTxHash as `0x${string}`,
        logIndex: 5,
        blockNumber: BigInt(1)
      }
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
        tokensPurchased: amount,
        txHash: transferTxHash,
        walletAddress: mockRecipientWallet,
        senderWalletAddress: mockSenderWallet,
        txLogIndex: 5
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

  it('should handle burn transactions', async () => {
    const randomWallet = randomWalletAddress().toLowerCase() as Address;

    const builder = await mockBuilder({ wallets: [{ address: randomWallet }] });

    const builderNft = await mockBuilderNft({ builderId: builder.id, season });

    const scoutWallet = randomWalletAddress().toLowerCase() as Address;

    const scout = await mockScout({ wallets: [scoutWallet] });

    const transferTxHash = `0x123${Math.random().toString().replace('.', '')}`;

    await recordNftTransfer({
      contractAddress: builderNft.contractAddress as Address,
      transferSingleEvent: {
        eventName: 'TransferSingle',
        args: {
          id: BigInt(builderNft.tokenId),
          value: BigInt(0),
          from: scoutWallet,
          to: NULL_EVM_ADDRESS,
          operator: randomWallet
        },
        transactionHash: transferTxHash as `0x${string}`,
        logIndex: 5,
        blockNumber: BigInt(1)
      }
    });

    const dbTransfer = await prisma.nFTPurchaseEvent.findFirst({
      where: {
        txHash: transferTxHash
      }
    });

    expect(dbTransfer).toMatchObject<NFTPurchaseEvent>({
      id: expect.any(String),
      builderNftId: builderNft.id,
      createdAt: expect.any(Date),
      paidInPoints: false,
      pointsValue: 0,
      tokensPurchased: 0,
      txHash: transferTxHash,
      walletAddress: null,
      senderWalletAddress: scoutWallet,
      txLogIndex: 5
    });
  });
});
