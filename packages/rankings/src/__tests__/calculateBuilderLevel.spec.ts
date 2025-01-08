import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import type { ISOWeek } from '@packages/dates/config';
import { getAllISOWeeksFromSeasonStart, getDateFromISOWeek } from '@packages/dates/utils';
import { prettyPrint } from '@packages/utils/strings';
import { uuidFromNumber } from '@packages/utils/uuid';

import { calculateBuilderLevels } from '../calculateBuilderLevel';

type GemReceiptInput = {
  isoWeek: string;
  value: number;
  date: Date;
};

type DeterministicRandomBuilderActivity = {
  id: string;
  totalGems: number;
  firstActiveWeek: string;
  activeWeeks: string[];
  gemReceiptInputs: GemReceiptInput[];
};

function seedBuilders({ season }: { season: ISOWeek }) {
  const weeks = getAllISOWeeksFromSeasonStart({ season });

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

  /**
   * Variables
   * Different first week of activity
   * Different gem receipts
   *
   *
   *
   *
   *
   *
   *
   *
   *
   */
  // Variables
  // Changing first week of activity

  // Setup 200 builders using a deterministic uuid per builder index
  // Create mock builders with random gem distributions
  const builders: DeterministicRandomBuilderActivity[] = Array.from({ length: 200 }, (_, index) => {
    // Use deterministic seed based on builder index, but with more variation
    const seed = (index * 17 + 31) % 997; // Using prime numbers for better distribution

    // Generate random total gems between 500-5000
    const totalGems = Math.floor(((seed % 45) + 5) * 100);

    // Generate random start week between W02-W10
    const firstWeekIndex = seed % weeks.length;
    const firstActiveWeek = weeks[firstWeekIndex];

    // Calculate active weeks from firstActiveWeek until last week
    const activeWeeks = weeks.slice(weeks.indexOf(firstActiveWeek));

    // Distribute gems across active weeks
    let gemsDistributed = 0;
    const gemReceiptInputs: GemReceiptInput[] = activeWeeks.map((week, weekIndex) => {
      // Use deterministic random distribution based on seed and week
      const weekSeed = (seed * (weekIndex + 1) + 41) % 1009; // Different prime for variation

      // Calculate remaining gems and weeks
      const remainingWeeks = activeWeeks.length - weekIndex;
      const gemsLeft = totalGems - gemsDistributed;

      // For last week, use all remaining gems
      if (weekIndex === activeWeeks.length - 1) {
        const value = gemsLeft;
        gemsDistributed += value;
        return { isoWeek: week, value, date: getDateFromISOWeek(week).toJSDate() };
      }

      // Distribute gems based on remaining weeks
      const portion = (weekSeed % 31) / (100 * remainingWeeks); // Scale portion by remaining weeks
      const value = Math.floor(gemsLeft * portion);
      gemsDistributed += value;

      const date = getDateFromISOWeek(week);
      date.plus({ days: 2 });
      return { isoWeek: week, value, date: date.toJSDate() };
    });

    return {
      id: uuidFromNumber(index),
      totalGems,
      firstActiveWeek,
      activeWeeks,
      gemReceiptInputs
    };
  });

  return builders;
}

describe('seedBuilders', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should generate builders with deterministic randomness', () => {
    const season = '2025-W02';

    const currentDate = new Date('2025-03-12T00:00:00Z');

    jest.setSystemTime(currentDate);

    const builders = seedBuilders({ season });
    expect(builders).toHaveLength(200);

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
});

describe('calculateBuilderLevels', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should calculate builder levels correctly, splitting them into centiles converted to levels, and return builders from highest to lowest score', async () => {
    const season = '2025-W02';

    const decileTable = [
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
    ];

    const currentDate = new Date('2025-03-12T00:00:00Z');

    jest.setSystemTime(currentDate);

    const builders = seedBuilders({ season });

    await prisma.scout.createMany({
      data: builders.map((builder) => ({
        id: builder.id,
        displayName: `Builder ${builder.id}`,
        path: `p-${builder.id}`,
        referralCode: `r-${builder.id}`
      }))
    });

    await prisma.builderNft.createMany({
      data: builders.map((builder, index) => ({
        builderId: builder.id,
        chainId: 10,
        contractAddress: `0x${season}`,
        tokenId: index + 1,
        currentPrice: BigInt(20),
        imageUrl: `https://example.com/image-${index}.png`,
        season
      }))
    });

    for (const builder of builders) {
      for (const gemReceipt of builder.gemReceiptInputs) {
        await prisma.builderEvent.create({
          data: {
            season,
            week: gemReceipt.isoWeek,
            type: 'daily_commit',
            gemsReceipt: {
              create: {
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
  });
});
