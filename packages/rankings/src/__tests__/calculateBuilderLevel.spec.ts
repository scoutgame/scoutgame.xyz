import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { getDateFromISOWeek, getPreviousSeason } from '@packages/dates/utils';
import { mockBuilder, mockBuilderNft } from '@packages/testing/database';
import { uuidFromNumber } from '@packages/utils/uuid';

import type { BuilderAggregateScore } from '../calculateBuilderLevel';
import { calculateBuilderLevels, decileTable } from '../calculateBuilderLevel';

import type { DeterministicRandomBuilderActivity } from './seedBuilders';
import { seedBuilders, writeSeededBuildersToDatabase } from './seedBuilders';

// Validate date based on deterministic output of 200 builders
function validateCalculations({
  builders,
  levels
}: {
  builders: DeterministicRandomBuilderActivity[];
  levels: BuilderAggregateScore[];
}) {
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
    const generatedBuilder = levels[i];
    const matchingBuilderInput = builders.find((b) => b.id === generatedBuilder.builderId);

    expect(generatedBuilder.averageGemsPerWeek).toBe(
      Math.floor(generatedBuilder.totalGems / matchingBuilderInput!.activeWeeks.length)
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
    builderId: uuidFromNumber(69),
    totalGems: 3200,
    averageGemsPerWeek: 1066,
    centile: 80,
    level: 9,
    firstActiveWeek: '2025-W09'
  });
  expect(builder87).toMatchObject<BuilderAggregateScore>({
    builderId: uuidFromNumber(155),
    totalGems: 4700,
    averageGemsPerWeek: 587,
    centile: 57,
    level: 6,
    firstActiveWeek: '2025-W04'
  });

  expect(builder156).toMatchObject<BuilderAggregateScore>({
    builderId: uuidFromNumber(47),
    totalGems: 2500,
    averageGemsPerWeek: 250,
    centile: 23,
    level: 3,
    firstActiveWeek: '2025-W02'
  });
}

describe('seedBuilders', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(async () => {
    jest.useRealTimers();
  });

  it('should generate builders with deterministic randomness, correct data and a default of 200 builders', () => {
    const season = '2025-W02';

    const currentDate = new Date('2025-03-12T00:00:00Z');

    jest.setSystemTime(currentDate);

    const { builders, weeks } = seedBuilders({ season });
    expect(builders).toHaveLength(200);

    // Make sure we have the correct set of weeks
    expect(weeks).toEqual([
      '2025-W02',
      '2025-W03',
      '2025-W04',
      '2025-W05',
      '2025-W06',
      '2025-W07',
      '2025-W08',
      '2025-W09',
      '2025-W10',
      '2025-W11'
    ]);

    // Verify total gems calculation for all builders
    builders.forEach((builder) => {
      const totalFromReceipts = builder.gemReceiptInputs.reduce((sum, receipt) => sum + receipt.value, 0);
      const avgGemsPerWeek = builder.totalGems / builder.activeWeeks.length;
      const totalFromAverage = avgGemsPerWeek * builder.activeWeeks.length;

      expect(builder.totalGems).toBe(totalFromReceipts);
      expect(Math.round(totalFromAverage)).toBe(builder.totalGems);
    });

    expect(builders[0]).toMatchObject<DeterministicRandomBuilderActivity>({
      id: uuidFromNumber(0),
      totalGems: 3600,
      firstActiveWeek: '2025-W03',
      activeWeeks: [
        '2025-W03',
        '2025-W04',
        '2025-W05',
        '2025-W06',
        '2025-W07',
        '2025-W08',
        '2025-W09',
        '2025-W10',
        '2025-W11'
      ],
      gemReceiptInputs: [
        {
          date: new Date('2025-01-13T00:00:00.000Z'),
          isoWeek: '2025-W03',
          value: 40
        },
        {
          date: new Date('2025-01-20T00:00:00.000Z'),
          isoWeek: '2025-W04',
          value: 44
        },
        {
          date: new Date('2025-01-27T00:00:00.000Z'),
          isoWeek: '2025-W05',
          value: 50
        },
        {
          date: new Date('2025-02-03T00:00:00.000Z'),
          isoWeek: '2025-W06',
          value: 57
        },
        {
          date: new Date('2025-02-10T00:00:00.000Z'),
          isoWeek: '2025-W07',
          value: 68
        },
        {
          date: new Date('2025-02-17T00:00:00.000Z'),
          isoWeek: '2025-W08',
          value: 83
        },
        {
          date: new Date('2025-02-24T00:00:00.000Z'),
          isoWeek: '2025-W09',
          value: 108
        },
        {
          date: new Date('2025-03-03T00:00:00.000Z'),
          isoWeek: '2025-W10',
          value: 157
        },
        {
          date: new Date('2025-03-10T00:00:00.000Z'),
          isoWeek: '2025-W11',
          value: 2993
        }
      ]
    });

    expect(builders[57]).toMatchObject<DeterministicRandomBuilderActivity>({
      id: uuidFromNumber(57),
      totalGems: 800,
      firstActiveWeek: '2025-W05',
      activeWeeks: ['2025-W05', '2025-W06', '2025-W07', '2025-W08', '2025-W09', '2025-W10', '2025-W11'],
      gemReceiptInputs: [
        {
          date: new Date('2025-01-27T00:00:00.000Z'),
          isoWeek: '2025-W05',
          value: 14
        },
        {
          date: new Date('2025-02-03T00:00:00.000Z'),
          isoWeek: '2025-W06',
          value: 20
        },
        {
          date: new Date('2025-02-10T00:00:00.000Z'),
          isoWeek: '2025-W07',
          value: 29
        },
        {
          date: new Date('2025-02-17T00:00:00.000Z'),
          isoWeek: '2025-W08',
          value: 40
        },
        {
          date: new Date('2025-02-24T00:00:00.000Z'),
          isoWeek: '2025-W09',
          value: 58
        },
        {
          date: new Date('2025-03-03T00:00:00.000Z'),
          isoWeek: '2025-W10',
          value: 89
        },
        {
          date: new Date('2025-03-10T00:00:00.000Z'),
          isoWeek: '2025-W11',
          value: 550
        }
      ]
    });

    expect(builders[187]).toMatchObject<DeterministicRandomBuilderActivity>({
      id: uuidFromNumber(187),
      totalGems: 4400,
      firstActiveWeek: '2025-W11',
      activeWeeks: ['2025-W11'],
      gemReceiptInputs: [
        {
          date: new Date('2025-03-10T00:00:00.000Z'),
          isoWeek: '2025-W11',
          value: 4400
        }
      ]
    });
  });

  it('should generate a custom amount of builders', () => {
    const season = '2025-W02';
    const amount = 100;

    const { builders } = seedBuilders({ season, amount });
    expect(builders).toHaveLength(amount);
  });
});

describe('calculateBuilderLevels', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(async () => {
    jest.useRealTimers();

    await prisma.scout.deleteMany({
      where: {
        id: {
          in: Array.from({ length: 200 }, (_, index) => uuidFromNumber(index))
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
    const season = '2025-W02';

    const currentDate = new Date('2025-03-12T00:00:00Z');

    jest.setSystemTime(currentDate);

    const { builders } = seedBuilders({ season });

    await writeSeededBuildersToDatabase({ builders, season });

    const levels = await calculateBuilderLevels({ season });

    validateCalculations({ builders, levels });
  });

  it('should exclude builders with 0 gems from the calculation', async () => {
    const season = '2025-W02';

    const currentDate = new Date('2025-03-12T00:00:00Z');

    jest.setSystemTime(currentDate);

    const { builders } = seedBuilders({ season });

    await writeSeededBuildersToDatabase({ builders, season });

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
    const season = '2025-W02';

    const currentDate = new Date('2025-03-12T00:00:00Z');

    jest.setSystemTime(currentDate);

    const { builders } = seedBuilders({ season });

    await writeSeededBuildersToDatabase({ builders, season });

    const indexOffset = 500;

    const { builders: ignoredBuilders } = seedBuilders({
      season: getPreviousSeason(season),
      amount: 57,
      indexOffset
    });

    await writeSeededBuildersToDatabase({ builders: ignoredBuilders, season: getPreviousSeason(season) });

    // Case where we didn't renew a builder for the current season, but we are still recording their activity
    for (let i = 0; i < ignoredBuilders.length; i++) {
      const builder = ignoredBuilders[i];
      for (let j = 0; j < builder.gemReceiptInputs.length; j++) {
        const gemReceipt = builder.gemReceiptInputs[j];

        await prisma.builderEvent.create({
          data: {
            season,
            week: gemReceipt.isoWeek,
            type: 'daily_commit',
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
