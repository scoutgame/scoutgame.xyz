import { BuilderEventType, BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { mockBuilder, mockBuilderNft, mockScout } from '@packages/testing/database';
import { generateRandomEthAddress } from '@packages/testing/random';

import { calculateEarnableScoutPointsForRank } from '../../points/calculatePoints';
import { nftTypeMultipliers } from '../../points/dividePointsBetweenBuilderAndScouts';
import { getAllSeasonNftsWithOwners } from '../getAllSeasonNftsWithOwners';
import { getCurrentWeekPointsAllocation } from '../getCurrentWeekPointsAllocation';

jest.unstable_mockModule('@packages/dates/utils', () => ({
  getCurrentSeasonStart: jest.fn((week) => week)
}));

describe('refreshEstimatedPayouts', () => {
  it('should refresh the estimated payouts for a season', async () => {
    const { refreshEstimatedPayouts } = await import('../refreshEstimatedPayouts');
    const { getWeeklyPointsPoolAndBuilders } = await import('../../points/getWeeklyPointsPoolAndBuilders');

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
    const scout1Wallet = generateRandomEthAddress();
    const scout2Wallet = generateRandomEthAddress();
    const scout3Wallet = generateRandomEthAddress();

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
    const nftPayouts = await refreshEstimatedPayouts({ week: season });

    const { topWeeklyBuilders, weeklyAllocatedPoints, totalPoints, normalisationFactor, normalisedBuilders } =
      await getWeeklyPointsPoolAndBuilders({
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
    expect(defaultNftsPayouts).toHaveLength(3);

    const starterPackNfts = nftPayouts.starter_pack;
    expect(starterPackNfts).toHaveLength(2);

    // Find each NFT and verify its estimated payout
    const builder1DefaultNftPayout = defaultNftsPayouts.find((nft) => nft.id === nft1.id);
    const builder1StarterPackPayout = starterPackNfts.find((nft) => nft.id === starterPack1.id);
    const builder2DefaultNftPayout = defaultNftsPayouts.find((nft) => nft.id === nft2.id);
    const builder2StarterPackPayout = starterPackNfts.find((nft) => nft.id === starterPack2.id);
    const builder3DefaultNftPayout = defaultNftsPayouts.find((nft) => nft.id === nft3.id);

    const builder1DefaultNftHoldersCount = builder1DefaultNftPayout!.nftOwners.reduce(
      (acc, nftOwner) => acc + nftOwner.balance,
      0
    );

    const builder1StarterPackHoldersCount = builder1StarterPackPayout!.nftOwners.reduce(
      (acc, nftOwner) => acc + nftOwner.balance,
      0
    );

    const builder1PointsAllocation = builder1Normalised!.normalisedPoints;

    console.log('builder1PointsAllocation', builder1PointsAllocation);

    // Scout 1 has 2 NFTs from builder 1 (100 points)
    expect(builder1DefaultNftHoldersCount).toBe(2);
    expect(builder1StarterPackHoldersCount).toBe(1);

    const weightedHolders =
      builder1DefaultNftHoldersCount * nftTypeMultipliers.default +
      builder1StarterPackHoldersCount * nftTypeMultipliers.starter_pack;

    expect(weightedHolders).toBe(2 * nftTypeMultipliers.default + 1 * nftTypeMultipliers.starter_pack);

    expect(Math.floor(builder1PointsAllocation)).toBe(2576);
    expect(Math.floor(builder1DefaultNftPayout!.estimatedPayout!)).toBe(
      Math.floor(builder1PointsAllocation / (weightedHolders + nftTypeMultipliers.default))
    );

    expect(Math.floor(builder1StarterPackPayout!.estimatedPayout!)).toBe(
      Math.floor(builder1PointsAllocation / (weightedHolders + nftTypeMultipliers.starter_pack))
    );

    // Scout 2 has 1 NFT from builder 2 (200 points)
    expect(builder2DefaultNftPayout?.estimatedPayout).toBe(200); // 200 points / 1 NFT = 200 per NFT

    // Scout 3 has 3 NFTs from builder 3 (150 points)
    expect(builder3DefaultNftPayout?.estimatedPayout).toBe(50); // 150 points / 3 NFTs = 50 per NFT

    // Verify starter pack NFT payouts

    const starterPack1Updated = starterPackNfts.find((n) => n.id === starterPack1.id);
    const starterPack2Updated = starterPackNfts.find((n) => n.id === starterPack2.id);

    // Starter packs should have 0 estimated payout
    expect(starterPack1Updated?.estimatedPayout).toBe(0);
    expect(starterPack2Updated?.estimatedPayout).toBe(0);
  });
});
