import { jest } from '@jest/globals';
import { uuidFromNumber } from '@packages/utils/uuid';

import type { DeterministicRandomBuilderActivity } from '../deterministicBuildersData';
import { seedBuilders } from '../deterministicBuildersData';

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
