import { InvalidInputError } from '@charmverse/core/errors';

import type { MockBuilder } from '../../testing/database';
import { mockBuilder, mockBuilderNft, mockNFTPurchaseEvent, mockScout } from '../../testing/database';
import { dividePointsBetweenBuilderAndScouts } from '../dividePointsBetweenBuilderAndScouts';
import type { PartialNftPurchaseEvent } from '../getWeeklyPointsPoolAndBuilders';

describe('dividePointsBetweenBuilderAndScouts', () => {
  let builder: MockBuilder;
  let builderNft: Awaited<ReturnType<typeof mockBuilderNft>>;
  let starterPackNft: Awaited<ReturnType<typeof mockBuilderNft>>;

  let scout1: Awaited<ReturnType<typeof mockScout>>;
  let scout2: Awaited<ReturnType<typeof mockScout>>;
  const nftPurchaseEvents: PartialNftPurchaseEvent[] = [];

  const season = 'season-1';
  const week = 'week-1';
  const rank = 1;
  const weeklyAllocatedPoints = 100_000;
  const normalisationFactor = 0.8;

  beforeAll(async () => {
    builder = await mockBuilder();

    builderNft = await mockBuilderNft({ builderId: builder.id, season });
    starterPackNft = await mockBuilderNft({ builderId: builder.id, season, nftType: 'starter_pack' });

    scout1 = await mockScout();
    scout2 = await mockScout();

    nftPurchaseEvents.push({
      ...(
        await mockNFTPurchaseEvent({
          builderId: builder.id,
          scoutId: scout1.id,
          season,
          week: 'week-0', // use a previous week to make sure it is included
          tokensPurchased: 10
        })
      ).nftPurchaseEvent,
      builderNft
    });

    nftPurchaseEvents.push({
      ...(
        await mockNFTPurchaseEvent({
          builderId: builder.id,
          scoutId: scout2.id,
          season,
          week,
          tokensPurchased: 20
        })
      ).nftPurchaseEvent,
      builderNft
    });

    nftPurchaseEvents.push({
      ...(
        await mockNFTPurchaseEvent({
          builderId: builder.id,
          scoutId: scout1.id,
          season,
          week,
          tokensPurchased: 10,
          nftType: 'starter_pack'
        })
      ).nftPurchaseEvent,
      builderNft: starterPackNft
    });
  });

  // Success Cases
  it('should correctly distribute points among scouts and builder, counting normal NFTs as 10x compared to starter pack NFTs', async () => {
    const result = dividePointsBetweenBuilderAndScouts({
      builderId: builder.id,
      nftPurchaseEvents,
      rank,
      weeklyAllocatedPoints,
      normalisationFactor
    });

    expect(result).toMatchObject(
      expect.objectContaining({
        nftSupply: {
          default: 30,
          starterPack: 10,
          total: 40
        },
        nftsByScout: {
          [scout1.id]: {
            default: 10,
            starterPack: 10
          },
          [scout2.id]: {
            default: 20,
            starterPack: 0
          }
        },
        earnableScoutPoints: 2400,
        pointsPerScout: expect.arrayContaining([
          expect.objectContaining({ scoutId: scout1.id, scoutPoints: 681 }),
          expect.objectContaining({ scoutId: scout2.id, scoutPoints: 1238 })
        ]),
        pointsForBuilder: 480
      })
    );

    const totalPointsDistributed = result.pointsPerScout.reduce((acc, scout) => acc + scout.scoutPoints, 0);
    expect(totalPointsDistributed + result.pointsForBuilder).toBeLessThanOrEqual(result.earnableScoutPoints);
  });

  // Error Cases
  it('should throw an error if builderId is invalid', async () => {
    expect(() => {
      dividePointsBetweenBuilderAndScouts({
        builderId: 'invalid-builder-id',
        nftPurchaseEvents,
        rank,
        weeklyAllocatedPoints,
        normalisationFactor
      });
    }).toThrow(InvalidInputError);
  });

  it('should throw an error if rank is invalid', async () => {
    expect(() => {
      dividePointsBetweenBuilderAndScouts({
        builderId: builder.id,
        nftPurchaseEvents,
        rank: -1,
        weeklyAllocatedPoints,
        normalisationFactor
      });
    }).toThrow('Invalid rank provided');
  });
});
