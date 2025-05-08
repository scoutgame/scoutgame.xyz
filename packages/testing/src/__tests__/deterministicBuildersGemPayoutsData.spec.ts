import { jest } from '@jest/globals';
import { uuidFromNumber } from '@packages/utils/uuid';

import { seedBuildersGemPayouts } from '../deterministicBuildersGemPayoutsData';
import type { DeterministicRandomBuilderGemsPayoutActivity } from '../deterministicBuildersGemPayoutsData';

describe('seedBuildersGemPayouts', () => {
  const season = '2025-W02';
  const weeks = [
    '2025-W02',
    '2025-W03',
    '2025-W04',
    '2025-W05',
    '2025-W06',
    '2025-W07',
    '2025-W08',
    '2025-W09',
    '2025-W10'
  ];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(async () => {
    jest.useRealTimers();
  });

  it('should generate builders with deterministic randomness, correct data and a default of 200 builders', () => {
    const currentDate = new Date('2025-03-12T00:00:00Z');

    jest.setSystemTime(currentDate);

    const { builders } = seedBuildersGemPayouts({ weeks });
    expect(builders).toHaveLength(200);

    // Verify total gems calculation for all builders
    builders.forEach((builder) => {
      const totalFromReceipts = builder.gemPayoutInputs.reduce((sum, receipt) => sum + receipt.value, 0);
      const avgGemsPerWeek = builder.totalPoints / builder.activeWeeks.length;
      const totalFromAverage = avgGemsPerWeek * builder.activeWeeks.length;

      expect(builder.totalPoints).toBe(totalFromReceipts);
      expect(Math.round(totalFromAverage)).toBe(builder.totalPoints);
    });

    expect(builders[0]).toMatchObject<DeterministicRandomBuilderGemsPayoutActivity>({
      id: uuidFromNumber(0),
      totalPoints: 3600,
      firstActiveWeek: '2025-W06',
      activeWeeks: ['2025-W06', '2025-W07', '2025-W08', '2025-W09', '2025-W10'],
      gemPayoutInputs: [
        {
          isoWeek: '2025-W06',
          value: 72,
          date: new Date('2025-02-03T00:00:00.000Z')
        },
        {
          isoWeek: '2025-W07',
          value: 88,
          date: new Date('2025-02-10T00:00:00.000Z')
        },
        {
          isoWeek: '2025-W08',
          value: 114,
          date: new Date('2025-02-17T00:00:00.000Z')
        },
        {
          isoWeek: '2025-W09',
          value: 166,
          date: new Date('2025-02-24T00:00:00.000Z')
        },
        {
          isoWeek: '2025-W10',
          value: 3160,
          date: new Date('2025-03-03T00:00:00.000Z')
        }
      ]
    });

    expect(builders[57]).toMatchObject<DeterministicRandomBuilderGemsPayoutActivity>({
      id: uuidFromNumber(57),
      totalPoints: 800,
      firstActiveWeek: '2025-W05',
      activeWeeks: ['2025-W05', '2025-W06', '2025-W07', '2025-W08', '2025-W09', '2025-W10'],
      gemPayoutInputs: [
        {
          date: new Date('2025-01-27T00:00:00.000Z'),
          isoWeek: '2025-W05',
          value: 17
        },
        {
          date: new Date('2025-02-03T00:00:00.000Z'),
          isoWeek: '2025-W06',
          value: 25
        },
        {
          date: new Date('2025-02-10T00:00:00.000Z'),
          isoWeek: '2025-W07',
          value: 36
        },
        {
          date: new Date('2025-02-17T00:00:00.000Z'),
          isoWeek: '2025-W08',
          value: 52
        },
        {
          date: new Date('2025-02-24T00:00:00.000Z'),
          isoWeek: '2025-W09',
          value: 83
        },
        {
          date: new Date('2025-03-03T00:00:00.000Z'),
          isoWeek: '2025-W10',
          value: 587
        }
      ]
    });

    expect(builders[187]).toMatchObject<DeterministicRandomBuilderGemsPayoutActivity>({
      id: uuidFromNumber(187),
      totalPoints: 4400,
      firstActiveWeek: '2025-W05',
      activeWeeks: ['2025-W05', '2025-W06', '2025-W07', '2025-W08', '2025-W09', '2025-W10'],
      gemPayoutInputs: [
        {
          date: new Date('2025-01-27T00:00:00.000Z'),
          isoWeek: '2025-W05',
          value: 88
        },
        {
          date: new Date('2025-02-03T00:00:00.000Z'),
          isoWeek: '2025-W06',
          value: 120
        },
        {
          date: new Date('2025-02-10T00:00:00.000Z'),
          isoWeek: '2025-W07',
          value: 167
        },
        {
          date: new Date('2025-02-17T00:00:00.000Z'),
          isoWeek: '2025-W08',
          value: 241
        },
        {
          date: new Date('2025-02-24T00:00:00.000Z'),
          isoWeek: '2025-W09',
          value: 56
        },
        {
          date: new Date('2025-03-03T00:00:00.000Z'),
          isoWeek: '2025-W10',
          value: 3728
        }
      ]
    });
  });

  it('should generate a custom amount of builders', () => {
    const amount = 100;

    const { builders } = seedBuildersGemPayouts({ weeks, amount });
    expect(builders).toHaveLength(amount);
  });
});
