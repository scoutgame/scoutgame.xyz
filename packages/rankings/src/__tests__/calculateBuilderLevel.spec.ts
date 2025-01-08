import { jest } from '@jest/globals';
import { getAllISOWeeksFromSeasonStart, getDateFromISOWeek } from '@packages/dates/utils';
import { uuidFromNumber } from '@packages/utils/uuid';

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

describe('calculateBuilderLevels', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should calculate builder levels correctly', () => {
    const season = '2025-W02';

    const currentDate = new Date('2025-03-12T00:00:00Z');

    jest.setSystemTime(currentDate);

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

    // Check that randomness is deterministic

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

    // const levels = calculateBuilderLevels({ season });
    // expect(levels).toEqual([]);
  });
});
