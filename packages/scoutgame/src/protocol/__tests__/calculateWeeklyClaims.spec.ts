import { stringUtils } from '@charmverse/core/utilities';
import { jest } from '@jest/globals';
import { mockBuilderNft, mockBuilder, mockScout } from '@packages/testing/database';
import { randomWalletAddress } from '@packages/testing/generators';
import { prettyPrint } from '@packages/utils/strings';

import type { WeeklyClaimsCalculated } from '../calculateWeeklyClaims';
import { scoutProtocolChainId } from '../constants';

jest.unstable_mockModule('@packages/scoutgame/points/getPointsCountForWeekWithNormalisation', () => ({
  getPointsCountForWeekWithNormalisation: jest.fn()
}));

const { calculateWeeklyClaims } = await import('../calculateWeeklyClaims');
const { getPointsCountForWeekWithNormalisation } = await import(
  '@packages/scoutgame/points/getPointsCountForWeekWithNormalisation'
);

describe('calculateWeeklyClaims', () => {
  it('should generate the correct claims', async () => {
    const builder1Wallet = randomWalletAddress().toLowerCase();

    const mockWeek = '2024-W42';

    const mockAddress = randomWalletAddress().toLowerCase();

    const builder1 = await mockBuilder({
      wallets: [{ address: builder1Wallet }]
    });

    const builder1Nft = await mockBuilderNft({
      builderId: builder1.id,
      tokenId: 1,
      chainId: scoutProtocolChainId,
      contractAddress: mockAddress
    });

    const builder2Wallet = randomWalletAddress().toLowerCase();
    const builder2 = await mockBuilder({
      wallets: [{ address: builder2Wallet }]
    });

    const builder2Nft = await mockBuilderNft({
      builderId: builder2.id,
      tokenId: 2,
      chainId: scoutProtocolChainId,
      contractAddress: mockAddress
    });

    const builder3Wallet = randomWalletAddress().toLowerCase();
    const builder3 = await mockBuilder({
      wallets: [{ address: builder3Wallet }]
    });

    const builder3Nft = await mockBuilderNft({
      builderId: builder3.id,
      tokenId: 3,
      chainId: scoutProtocolChainId,
      contractAddress: mockAddress
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
      getPointsCountForWeekWithNormalisation as jest.Mock<typeof getPointsCountForWeekWithNormalisation>
    ).mockResolvedValueOnce({
      normalisationFactor: 1,
      weeklyAllocatedPoints: 1000,
      totalPoints: 1000,
      normalisedBuilders: [],
      topWeeklyBuilders: [
        {
          builder: builder1,
          rank: 1,
          gemsCollected: 100
        },
        {
          builder: builder2,
          rank: 2,
          gemsCollected: 75
        },
        {
          builder: builder3,
          rank: 3,
          gemsCollected: 50
        }
      ]
    });

    const weeklyClaimsData = await calculateWeeklyClaims({
      nftContractAddress: mockAddress,
      week: mockWeek,
      tokenBalances: {
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
      }
    });

    const weeklyClaimId = weeklyClaimsData.builderEvents[0].weeklyClaimId as string;

    expect(stringUtils.isUUID(weeklyClaimId)).toBe(true);

    expect(weeklyClaimsData).toMatchObject<WeeklyClaimsCalculated>({
      builderEvents: expect.arrayContaining<WeeklyClaimsCalculated['builderEvents'][number]>([
        {
          builderId: builder1.id,
          id: expect.any(String),
          season: '2024-W41',
          type: 'gems_payout',
          week: mockWeek,
          weeklyClaimId
        },
        {
          builderId: builder2.id,
          id: expect.any(String),
          season: '2024-W41',
          type: 'gems_payout',
          week: mockWeek,
          weeklyClaimId
        },
        {
          builderId: builder3.id,
          id: expect.any(String),
          season: '2024-W41',
          type: 'gems_payout',
          week: mockWeek,
          weeklyClaimId
        }
      ]),
      claims: expect.arrayContaining([
        {
          address: builder1Wallet,
          amount: '15000000000000000000'
        },
        {
          address: builder2Wallet,
          amount: '12000000000000000000'
        },
        {
          address: builder3Wallet,
          amount: '11000000000000000000'
        },
        {
          address: scout1Wallet,
          amount: '7000000000000000000'
        },
        {
          address: scout2Wallet,
          amount: '5000000000000000000'
        },
        {
          address: scout3Wallet,
          amount: '7000000000000000000'
        },
        {
          address: scout4Wallet,
          amount: '7000000000000000000'
        },
        {
          address: scout5Wallet,
          amount: '7000000000000000000'
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
          value: '6000000000000000000',
          recipientWalletAddress: builder1Wallet
        },
        {
          eventId: expect.any(String),
          value: '9000000000000000000',
          recipientWalletAddress: builder1Wallet
        },
        {
          eventId: expect.any(String),
          value: '4000000000000000000',
          recipientWalletAddress: scout1Wallet
        },
        {
          eventId: expect.any(String),
          value: '2000000000000000000',
          recipientWalletAddress: scout2Wallet
        },
        {
          eventId: expect.any(String),
          value: '3000000000000000000',
          recipientWalletAddress: scout3Wallet
        },
        {
          eventId: expect.any(String),
          value: '1000000000000000000',
          recipientWalletAddress: scout4Wallet
        },
        {
          eventId: expect.any(String),
          value: '5000000000000000000',
          recipientWalletAddress: builder2Wallet
        },
        {
          eventId: expect.any(String),
          value: '7000000000000000000',
          recipientWalletAddress: builder2Wallet
        },
        {
          eventId: expect.any(String),
          value: '4000000000000000000',
          recipientWalletAddress: scout3Wallet
        },
        {
          eventId: expect.any(String),
          value: '3000000000000000000',
          recipientWalletAddress: scout4Wallet
        },
        {
          eventId: expect.any(String),
          value: '2000000000000000000',
          recipientWalletAddress: scout1Wallet
        },
        {
          eventId: expect.any(String),
          value: '3000000000000000000',
          recipientWalletAddress: scout5Wallet
        },
        {
          eventId: expect.any(String),
          value: '5000000000000000000',
          recipientWalletAddress: builder3Wallet
        },
        {
          eventId: expect.any(String),
          value: '6000000000000000000',
          recipientWalletAddress: builder3Wallet
        },
        {
          eventId: expect.any(String),
          value: '4000000000000000000',
          recipientWalletAddress: scout5Wallet
        },
        {
          eventId: expect.any(String),
          value: '3000000000000000000',
          recipientWalletAddress: scout2Wallet
        },
        {
          eventId: expect.any(String),
          value: '1000000000000000000',
          recipientWalletAddress: scout1Wallet
        },
        {
          eventId: expect.any(String),
          value: '3000000000000000000',
          recipientWalletAddress: scout4Wallet
        }
      ])
    });

    const totalTokensInClaims = weeklyClaimsData.claims.reduce((sum, claim) => sum + Number(claim.amount), 0);
    const totalTokensInReceipts = weeklyClaimsData.tokenReceipts.reduce(
      (sum, receipt) => sum + Number(receipt.value),
      0
    );

    expect(totalTokensInClaims).toBe(totalTokensInReceipts);

    // Verify each wallet only appears once in claims
    const walletAddresses = weeklyClaimsData.claims.map((claim) => claim.address);
    const uniqueWalletAddresses = new Set(walletAddresses);
    expect(walletAddresses.length).toBe(uniqueWalletAddresses.size);
  });
});
