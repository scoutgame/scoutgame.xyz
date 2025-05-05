import { stringUtils } from '@charmverse/core/utilities';
import { jest } from '@jest/globals';
import { mockBuilderNft, mockBuilder, mockScout } from '@packages/testing/database';
import { randomWalletAddress } from '@packages/testing/generators';
import { formatUnits } from 'viem';

import type { WeeklyClaimsCalculated } from '../calculateWeeklyClaims';
import { devTokenDecimals, scoutProtocolChainId } from '../constants';

jest.unstable_mockModule('@packages/scoutgame/tokens/getTokensCountForWeekWithNormalisation', () => ({
  getTokensCountForWeekWithNormalisation: jest.fn()
}));

const mockWeek = '2024-W42';
const mockSeasonStart = '2024-W41';

jest.unstable_mockModule('@packages/dates/utils', () => ({
  getCurrentWeek: jest.fn(() => mockWeek),
  getCurrentSeasonStart: jest.fn(() => mockSeasonStart),
  getSeasonConfig: jest.fn(() => ({
    gemsPerRank: 10
  }))
}));

const { calculateWeeklyClaims } = await import('../calculateWeeklyClaims');
const { getTokensCountForWeekWithNormalisation } = await import('../../tokens/getTokensCountForWeekWithNormalisation');

describe('calculateWeeklyClaims', () => {
  it('should generate the correct claims', async () => {
    const builder1Wallet = randomWalletAddress().toLowerCase();

    const mockAddress = randomWalletAddress().toLowerCase();

    const builder1 = await mockBuilder({
      wallets: [{ address: builder1Wallet }]
    });

    const builder1Nft = await mockBuilderNft({
      builderId: builder1.id,
      tokenId: 1,
      chainId: scoutProtocolChainId,
      contractAddress: mockAddress,
      season: mockSeasonStart
    });

    const builder2Wallet = randomWalletAddress().toLowerCase();
    const builder2 = await mockBuilder({
      wallets: [{ address: builder2Wallet }]
    });

    const builder2Nft = await mockBuilderNft({
      builderId: builder2.id,
      tokenId: 2,
      chainId: scoutProtocolChainId,
      contractAddress: mockAddress,
      season: mockSeasonStart
    });

    const builder3Wallet = randomWalletAddress().toLowerCase();
    const builder3 = await mockBuilder({
      wallets: [{ address: builder3Wallet }]
    });

    const builder3Nft = await mockBuilderNft({
      builderId: builder3.id,
      tokenId: 3,
      chainId: scoutProtocolChainId,
      contractAddress: mockAddress,
      season: mockSeasonStart
    });

    const scout1Wallet = randomWalletAddress().toLowerCase();
    const scout1 = await mockScout({
      wallets: [scout1Wallet]
    });

    const scout2Wallet = randomWalletAddress().toLowerCase();
    const scout2 = await mockScout({
      wallets: [scout2Wallet]
    });

    const scout3Wallet = randomWalletAddress().toLowerCase();
    const scout3 = await mockScout({
      wallets: [scout3Wallet]
    });

    const scout4Wallet = randomWalletAddress().toLowerCase();
    const scout4 = await mockScout({
      wallets: [scout4Wallet]
    });

    const scout5Wallet = randomWalletAddress().toLowerCase();
    const scout5 = await mockScout({
      wallets: [scout5Wallet]
    });

    (
      getTokensCountForWeekWithNormalisation as jest.Mock<typeof getTokensCountForWeekWithNormalisation>
    ).mockResolvedValueOnce({
      normalisationFactor: BigInt(1),
      normalisationScale: BigInt(1),
      weeklyAllocatedTokens: BigInt(1000),
      totalTokens: BigInt(1000),
      normalisedDevelopers: [],
      topWeeklyDevelopers: [
        {
          developer: builder1,
          rank: 1,
          gemsCollected: 100
        },
        {
          developer: builder2,
          rank: 2,
          gemsCollected: 75
        },
        {
          developer: builder3,
          rank: 3,
          gemsCollected: 50
        }
      ]
    });

    const weeklyClaimsData = await calculateWeeklyClaims({
      // nftContractAddress: mockAddress as Address,
      week: mockWeek,
      tokenBalances: {
        standard: {
          1: {
            [builder1Wallet]: 100,
            [scout1Wallet]: 50,
            [scout2Wallet]: 25,
            [scout3Wallet]: 35,
            [scout4Wallet]: 15
          },
          2: {
            [builder2Wallet]: 75,
            [scout3Wallet]: 40,
            [scout4Wallet]: 35,
            [scout1Wallet]: 20,
            [scout5Wallet]: 30
          },
          3: {
            [builder3Wallet]: 90,
            [scout5Wallet]: 60,
            [scout2Wallet]: 45,
            [scout1Wallet]: 25,
            [scout4Wallet]: 40
          }
        },
        starter: {}
      }
    });

    const weeklyClaimId = weeklyClaimsData.weeklyClaimId as string;

    expect(stringUtils.isUUID(weeklyClaimId)).toBe(true);

    expect(weeklyClaimsData).toMatchObject<WeeklyClaimsCalculated>({
      builderEvents: expect.arrayContaining<WeeklyClaimsCalculated['builderEvents'][number]>([
        {
          builderId: builder1.id,
          id: expect.any(String),
          season: mockSeasonStart,
          type: 'gems_payout',
          week: mockWeek,
          weeklyClaimId
        },
        {
          builderId: builder2.id,
          id: expect.any(String),
          season: mockSeasonStart,
          type: 'gems_payout',
          week: mockWeek,
          weeklyClaimId
        },
        {
          builderId: builder3.id,
          id: expect.any(String),
          season: mockSeasonStart,
          type: 'gems_payout',
          week: mockWeek,
          weeklyClaimId
        }
      ]),
      claims: expect.arrayContaining([
        {
          address: builder1Wallet,
          amount: '15'
        },
        {
          address: builder2Wallet,
          amount: '12'
        },
        {
          address: builder3Wallet,
          amount: '11'
        },
        {
          address: scout1Wallet,
          amount: '7'
        },
        {
          address: scout2Wallet,
          amount: '5'
        },
        {
          address: scout3Wallet,
          amount: '7'
        },
        {
          address: scout4Wallet,
          amount: '7'
        },
        {
          address: scout5Wallet,
          amount: '7'
        }
      ]),
      weeklyClaimId,
      merkleProofs: {
        tree: expect.anything(),
        rootHash: expect.any(String)
      },
      tokenReceipts: expect.arrayContaining<WeeklyClaimsCalculated['tokenReceipts'][number]>([
        {
          eventId: expect.any(String),
          value: '6',
          recipientWalletAddress: builder1Wallet
        },
        {
          eventId: expect.any(String),
          value: '9',
          recipientWalletAddress: builder1Wallet
        },
        {
          eventId: expect.any(String),
          value: '4',
          recipientWalletAddress: scout1Wallet
        },
        {
          eventId: expect.any(String),
          value: '2',
          recipientWalletAddress: scout2Wallet
        },
        {
          eventId: expect.any(String),
          value: '3',
          recipientWalletAddress: scout3Wallet
        },
        {
          eventId: expect.any(String),
          value: '1',
          recipientWalletAddress: scout4Wallet
        },
        {
          eventId: expect.any(String),
          value: '5',
          recipientWalletAddress: builder2Wallet
        },
        {
          eventId: expect.any(String),
          value: '7',
          recipientWalletAddress: builder2Wallet
        },
        {
          eventId: expect.any(String),
          value: '4',
          recipientWalletAddress: scout3Wallet
        },
        {
          eventId: expect.any(String),
          value: '3',
          recipientWalletAddress: scout4Wallet
        },
        {
          eventId: expect.any(String),
          value: '2',
          recipientWalletAddress: scout1Wallet
        },
        {
          eventId: expect.any(String),
          value: '3',
          recipientWalletAddress: scout5Wallet
        },
        {
          eventId: expect.any(String),
          value: '5',
          recipientWalletAddress: builder3Wallet
        },
        {
          eventId: expect.any(String),
          value: '6',
          recipientWalletAddress: builder3Wallet
        },
        {
          eventId: expect.any(String),
          value: '4',
          recipientWalletAddress: scout5Wallet
        },
        {
          eventId: expect.any(String),
          value: '3',
          recipientWalletAddress: scout2Wallet
        },
        {
          eventId: expect.any(String),
          value: '1',
          recipientWalletAddress: scout1Wallet
        },
        {
          eventId: expect.any(String),
          value: '3',
          recipientWalletAddress: scout4Wallet
        }
      ])
    });

    const totalTokensInClaims = weeklyClaimsData.claims.reduce((sum, claim) => sum + BigInt(claim.amount), BigInt(0));
    const totalTokensInReceipts = weeklyClaimsData.tokenReceipts.reduce(
      (sum, receipt) => sum + BigInt(receipt.value),
      BigInt(0)
    );
    expect(totalTokensInClaims).toBe(totalTokensInReceipts);

    // Verify each wallet only appears once in claims
    const walletAddresses = weeklyClaimsData.claims.map((claim) => claim.address);
    const uniqueWalletAddresses = new Set(walletAddresses);
    expect(walletAddresses.length).toBe(uniqueWalletAddresses.size);
  });
});
