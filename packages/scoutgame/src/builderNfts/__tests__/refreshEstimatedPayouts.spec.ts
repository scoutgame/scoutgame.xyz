import { BuilderEventType, BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { seasons } from '@packages/dates/config';
import { mockBuilder, mockBuilderNft, mockScout } from '@packages/testing/database';
import { randomWalletAddress } from '@packages/testing/generators';

import { getAllSeasonNftsWithOwners } from '../getAllSeasonNftsWithOwners';

jest.unstable_mockModule('@packages/dates/utils', () => ({
  getCurrentSeasonStart: jest.fn(() => '2024-TEST78'),
  getCurrentSeason: jest.fn(() => seasons[2])
}));

const defaultScoutShare = 0.7;
const starterPackShare = 0.1;

describe('refreshEstimatedPayouts', () => {
  it('should refresh the estimated payouts for a season, and zero out the payouts for builders who dont rank', async () => {
    const { refreshEstimatedPayouts } = await import('../refreshEstimatedPayouts');
    const { getPointsCountForWeekWithNormalisation } = await import(
      '../../tokens/getTokensCountForWeekWithNormalisation'
    );

    const season = '2024-TEST78';

    const builder1 = await mockBuilder({
      weeklyStats: [
        {
          gemsCollected: 300,
          week: season,
          season
        }
      ]
    });
    const builder2 = await mockBuilder({
      weeklyStats: [
        {
          gemsCollected: 200,
          week: season,
          season
        }
      ]
    });
    const builder3 = await mockBuilder({
      weeklyStats: [
        {
          gemsCollected: 100,
          week: season,
          season
        }
      ]
    });

    const builderWithoutRank = await mockBuilder({
      weeklyStats: []
    });

    // Create regular NFTs for each builder
    const nft1 = await mockBuilderNft({
      builderId: builder1.id,
      season,
      nftType: BuilderNftType.default
    });

    const nft2 = await mockBuilderNft({
      builderId: builder2.id,
      season,
      nftType: BuilderNftType.default
    });

    const nft3 = await mockBuilderNft({
      builderId: builder3.id,
      season,
      nftType: BuilderNftType.default
    });

    const nft4 = await mockBuilderNft({
      builderId: builderWithoutRank.id,
      season,
      nftType: BuilderNftType.default,
      estimatedPayout: 100
    });

    // Create starter pack NFTs for 2 builders
    const starterPack1 = await mockBuilderNft({
      builderId: builder1.id,
      season,
      nftType: BuilderNftType.starter_pack
    });

    const starterPack2 = await mockBuilderNft({
      builderId: builder2.id,
      season,
      nftType: BuilderNftType.starter_pack
    });

    // Create builder events
    const builderEvent1 = await prisma.builderEvent.create({
      data: {
        builderId: builder1.id,
        season,
        type: BuilderEventType.daily_commit,
        description: 'Test event 1',
        week: season
      }
    });

    const builderEvent2 = await prisma.builderEvent.create({
      data: {
        builderId: builder2.id,
        season,
        type: BuilderEventType.daily_commit,
        description: 'Test event 2',
        week: season
      }
    });

    const builderEvent3 = await prisma.builderEvent.create({
      data: {
        builderId: builder3.id,
        season,
        type: BuilderEventType.daily_commit,
        description: 'Test event 3',
        week: season
      }
    });

    // Create scouts with NFTs
    const scout1Wallet = randomWalletAddress();
    const scout2Wallet = randomWalletAddress();
    const scout3Wallet = randomWalletAddress();

    const scout1 = await mockScout({ wallets: [scout1Wallet] });
    const scout2 = await mockScout({ wallets: [scout2Wallet] });
    const scout3 = await mockScout({ wallets: [scout3Wallet] });

    // Distribute NFTs to scouts
    await prisma.scoutNft.createMany({
      data: [
        {
          builderNftId: nft1.id,
          walletAddress: scout1Wallet,
          balance: 2
        },
        {
          builderNftId: nft2.id,
          walletAddress: scout2Wallet,
          balance: 1
        },
        {
          builderNftId: nft3.id,
          walletAddress: scout3Wallet,
          balance: 3
        },
        {
          builderNftId: starterPack1.id,
          walletAddress: scout1Wallet,
          balance: 1
        },
        {
          builderNftId: starterPack2.id,
          walletAddress: scout2Wallet,
          balance: 1
        }
      ]
    });

    // TODO: Add assertions to verify estimated payouts
    // Call the function to refresh estimated payouts
    await refreshEstimatedPayouts({ week: season });

    const nftPayouts = await getAllSeasonNftsWithOwners({ season });

    const { topWeeklyBuilders, weeklyAllocatedPoints, totalPoints, normalisationFactor, normalisedBuilders } =
      await getPointsCountForWeekWithNormalisation({
        week: season
      });

    expect(weeklyAllocatedPoints).toBe(7_500);

    expect(totalPoints * normalisationFactor).toBe(7_500);

    const builder1Normalised = normalisedBuilders.find((b) => b.builder.builder.id === builder1.id);
    expect(builder1Normalised!.builder.rank).toBe(1);

    const builder2Normalised = normalisedBuilders.find((b) => b.builder.builder.id === builder2.id);
    expect(builder2Normalised!.builder.rank).toBe(2);

    const builder3Normalised = normalisedBuilders.find((b) => b.builder.builder.id === builder3.id);
    expect(builder3Normalised!.builder.rank).toBe(3);

    // Verify default NFT payouts
    const defaultNftsPayouts = nftPayouts.default;
    expect(defaultNftsPayouts).toHaveLength(4);

    const starterPackNfts = nftPayouts.starter_pack;
    expect(starterPackNfts).toHaveLength(2);

    // Find each NFT and verify its estimated payout
    const builder1DefaultNftPayout = defaultNftsPayouts.find((nft) => nft.id === nft1.id);
    const builder1StarterPackPayout = starterPackNfts.find((nft) => nft.id === starterPack1.id);
    const builder2DefaultNftPayout = defaultNftsPayouts.find((nft) => nft.id === nft2.id);
    const builder2StarterPackPayout = starterPackNfts.find((nft) => nft.id === starterPack2.id);
    const builder3DefaultNftPayout = defaultNftsPayouts.find((nft) => nft.id === nft3.id);

    // Builder 1 calculations
    const builder1DefaultNftHoldersCount = builder1DefaultNftPayout!.nftOwners.reduce(
      (acc, nftOwner) => acc + nftOwner.balance,
      0
    );

    const builder1StarterPackHoldersCount = builder1StarterPackPayout!.nftOwners.reduce(
      (acc, nftOwner) => acc + nftOwner.balance,
      0
    );

    const builder1PointsAllocation = builder1Normalised!.normalisedPoints;

    expect(builder1DefaultNftHoldersCount).toBe(2);
    expect(builder1StarterPackHoldersCount).toBe(1);

    expect(Math.floor(builder1PointsAllocation)).toBe(2576);

    const expectedNftPayout = Math.floor(
      (defaultScoutShare * builder1PointsAllocation) / (builder1DefaultNftHoldersCount + 1)
    );

    expect(Math.floor(builder1DefaultNftPayout!.estimatedPayout!)).toBe(expectedNftPayout);

    expect(expectedNftPayout).toBe(601);

    const expectedStarterPackPayout = Math.floor(
      (starterPackShare * builder1PointsAllocation) / (builder1StarterPackHoldersCount + 1)
    );

    expect(expectedStarterPackPayout).toBe(128);

    expect(Math.floor(builder1StarterPackPayout!.estimatedPayout!)).toBe(expectedStarterPackPayout);

    // Builder 2 calculations
    const builder2DefaultNftHoldersCount = builder2DefaultNftPayout!.nftOwners.reduce(
      (acc, nftOwner) => acc + nftOwner.balance,
      0
    );

    const builder2StarterPackHoldersCount = builder2StarterPackPayout!.nftOwners.reduce(
      (acc, nftOwner) => acc + nftOwner.balance,
      0
    );

    const builder2PointsAllocation = builder2Normalised!.normalisedPoints;

    expect(Math.floor(builder2PointsAllocation)).toBe(2499);

    expect(builder2DefaultNftHoldersCount).toBe(1);
    expect(builder2StarterPackHoldersCount).toBe(1);

    const expectedBuilder2NftPayout = Math.floor(
      (defaultScoutShare * builder2PointsAllocation) / (builder2DefaultNftHoldersCount + 1)
    );

    expect(expectedBuilder2NftPayout).toBe(874);

    expect(Math.floor(builder2DefaultNftPayout!.estimatedPayout!)).toBe(expectedBuilder2NftPayout);

    const expectedBuilder2StarterPackPayout = Math.floor(
      (starterPackShare * builder2PointsAllocation) / (builder2StarterPackHoldersCount + 1)
    );

    expect(expectedBuilder2StarterPackPayout).toBe(124);

    expect(Math.floor(builder2StarterPackPayout!.estimatedPayout!)).toBe(expectedBuilder2StarterPackPayout);

    // Builder 3 calculations
    const builder3DefaultNftHoldersCount = builder3DefaultNftPayout!.nftOwners.reduce(
      (acc, nftOwner) => acc + nftOwner.balance,
      0
    );

    const builder3PointsAllocation = builder3Normalised!.normalisedPoints;

    expect(Math.floor(builder3PointsAllocation)).toBe(2424);

    expect(builder3DefaultNftHoldersCount).toBe(3);

    const builder3WeightedHolders = builder3DefaultNftHoldersCount;

    expect(builder3WeightedHolders).toBe(builder3DefaultNftHoldersCount);

    const expectedBuilder3NftPayout = Math.floor(0.7 * builder3PointsAllocation * (1 / (builder3WeightedHolders + 1)));

    expect(expectedBuilder3NftPayout).toBe(424);

    expect(Math.floor(builder3DefaultNftPayout!.estimatedPayout!)).toBe(expectedBuilder3NftPayout);

    const nft4AfterRefresh = await prisma.builderNft.findUniqueOrThrow({
      where: {
        id: nft4.id
      }
    });

    expect(nft4AfterRefresh.estimatedPayout).toBe(0);
  });
});
