import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { getCurrentWeek, getDateFromISOWeek, getPreviousSeason } from '@packages/dates/utils';
import { mockBuilder, mockBuilderNft } from '@packages/testing/database';
import type { DeterministicRandomBuilderGemsPayoutActivity } from '@packages/testing/deterministicBuildersGemPayoutsData';
import {
  seedBuildersGemPayouts,
  writeSeededBuildersGemPayoutsToDatabase
} from '@packages/testing/deterministicBuildersGemPayoutsData';
import { randomWalletAddress } from '@packages/testing/generators';
import { uuidFromNumber } from '@packages/utils/uuid';

import type { BuilderAggregateScore } from '../calculateBuilderLevel';
import { calculateBuilderLevels, decileTable } from '../calculateBuilderLevel';

const season = '2025-W02';

// Validate date based on deterministic output of 200 builders
function validateCalculations({
  builders,
  levels
}: {
  builders: DeterministicRandomBuilderGemsPayoutActivity[];
  levels: BuilderAggregateScore[];
}) {
  expect(levels.length).toBeGreaterThan(0);

  // Verify levels are assigned correctly based on percentiles
  for (let i = 0; i < levels.length; i++) {
    const builder = levels[i];
    const { centile, level } = builder;
    const matchingCutoff = decileTable.find((d) => centile >= d.cutoff);
    expect(level).toBe(matchingCutoff?.level);
  }

  // Verify minimum percentile and level is 1
  expect(Math.min(...levels.map((b) => b.centile))).toBeGreaterThanOrEqual(1);
  expect(Math.min(...levels.map((b) => b.level))).toBe(1);

  // Verify average gems per week calculation
  for (let i = 0; i < levels.length; i++) {
    const builderFromCalculation = levels[i];
    const matchingBuilderInput = builders.find((b) => b.id === builderFromCalculation.builderId);

    expect(builderFromCalculation.averageGemsPerWeek).toBe(
      Math.floor(builderFromCalculation.totalPoints / matchingBuilderInput!.activeWeeks.length)
    );
  }

  // Verify ranking order follows average gems per week descending
  for (let i = 1; i < levels.length; i++) {
    expect(levels[i - 1].averageGemsPerWeek).toBeGreaterThanOrEqual(levels[i].averageGemsPerWeek);
  }

  // Sample 3 random indexes to verify exact shape
  const builder42 = levels[42];
  const builder87 = levels[87];
  const builder156 = levels[156];

  expect(builder42).toMatchObject<BuilderAggregateScore>({
    builderId: expect.any(String),
    totalPoints: 4800,
    averageGemsPerWeek: 2400,
    centile: 80,
    level: 9,
    firstActiveWeek: '2025-W03',
    activeWeeks: 2
  });
  expect(builder87).toMatchObject<BuilderAggregateScore>({
    builderId: expect.any(String),
    totalPoints: 1600,
    averageGemsPerWeek: 1600,
    centile: 57,
    level: 6,
    firstActiveWeek: '2025-W04',
    activeWeeks: 1
  });

  expect(builder156).toMatchObject<BuilderAggregateScore>({
    builderId: expect.any(String),
    totalPoints: 2000,
    averageGemsPerWeek: 666,
    centile: 23,
    level: 3,
    firstActiveWeek: '2025-W02',
    activeWeeks: 3
  });
}

/**
 * We use this offset for the deterministic random generator to keep deterministic data but avoid collisions between tests
 */
const indexOffset = 12344;

describe('calculateBuilderLevels', () => {
  beforeEach(() => {
    jest.useFakeTimers();

    // Use 2025-W05 as the current season so we have 3 weeks of data from W-02 to W-04
    jest.setSystemTime(new Date('2025-01-29T00:00:00Z'));

    expect(getCurrentWeek()).toBe('2025-W05');
  });

  afterEach(async () => {
    jest.useRealTimers();

    await prisma.scout.deleteMany({
      where: {
        id: {
          in: Array.from({ length: 300 }, (_, index) => uuidFromNumber(index + indexOffset))
        }
      }
    });
  });

  it('should be based on the correct deciles', () => {
    expect(decileTable).toMatchObject([
      { cutoff: 90, level: 10 },
      { cutoff: 80, level: 9 },
      { cutoff: 70, level: 8 },
      { cutoff: 60, level: 7 },
      { cutoff: 50, level: 6 },
      { cutoff: 40, level: 5 },
      { cutoff: 30, level: 4 },
      { cutoff: 20, level: 3 },
      { cutoff: 10, level: 2 },
      { cutoff: 0, level: 1 }
    ]);
  });

  it('should calculate builder levels correctly, splitting them into centiles converted to levels, and return builders from highest to lowest score', async () => {
    const { builders } = seedBuildersGemPayouts({ season, indexOffset });

    await writeSeededBuildersGemPayoutsToDatabase({ builders, season });

    const levels = await calculateBuilderLevels({ season });

    validateCalculations({ builders, levels });
  });

  it('should exclude builders with 0 gems from the calculation', async () => {
    const { builders } = seedBuildersGemPayouts({ season, indexOffset });

    await writeSeededBuildersGemPayoutsToDatabase({ builders, season });

    // Add 57 builders with no gems
    await Promise.all(
      Array.from({ length: 57 }, async (_, index) => {
        const builder = await mockBuilder({});

        await mockBuilderNft({
          builderId: builder.id,
          season
        });
      })
    );

    const levels = await calculateBuilderLevels({ season });

    validateCalculations({
      builders,
      levels
    });
  });

  it('should ignore builders without NFTs in the current season', async () => {
    const { builders } = seedBuildersGemPayouts({ season, indexOffset });

    await writeSeededBuildersGemPayoutsToDatabase({ builders, season });

    const { builders: ignoredBuilders } = seedBuildersGemPayouts({
      season: getPreviousSeason(season)!,
      amount: 57,
      indexOffset: indexOffset * 2
    });

    await writeSeededBuildersGemPayoutsToDatabase({ builders: ignoredBuilders, season: getPreviousSeason(season)! });

    // Case where we didn't renew a builder for the current season, but we are still recording their activity
    for (let i = 0; i < ignoredBuilders.length; i++) {
      const builder = ignoredBuilders[i];
      for (let j = 0; j < builder.gemPayoutInputs.length; j++) {
        const gemReceipt = builder.gemPayoutInputs[j];

        await prisma.builderEvent.create({
          data: {
            season,
            week: gemReceipt.isoWeek,
            type: 'gems_payout',
            createdAt: getDateFromISOWeek(gemReceipt.isoWeek).toJSDate(),
            gemsReceipt: {
              create: {
                createdAt: getDateFromISOWeek(gemReceipt.isoWeek).toJSDate(),
                type: 'daily_commit',
                value: gemReceipt.value
              }
            },
            builder: {
              connect: {
                id: builder.id
              }
            }
          }
        });
      }
    }

    const levels = await calculateBuilderLevels({ season });

    // Ignored builders should not show up
    expect(levels.length).toBe(builders.length);

    validateCalculations({
      builders,
      levels
    });
  });
});
