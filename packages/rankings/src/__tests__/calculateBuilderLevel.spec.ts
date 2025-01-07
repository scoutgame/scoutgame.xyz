import { jest } from '@jest/globals';
import { getAllISOWeeksFromSeasonStartUntilSeasonEnd } from '@packages/scoutgame/dates/utils';

import { calculateBuilderLevels } from '../calculateBuilderLevel';

describe('calculateBuilderLevels', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should calculate builder levels correctly', () => {
    const season = '2025-W02';

    const weeks = getAllISOWeeksFromSeasonStartUntilSeasonEnd({ season: '2025-W02' });

    // Setup 200 builders using a deterministic uuid per builder index
    // Create mock builders with random gem distributions
    const builders = Array.from({ length: 200 }, (_, index) => {
      // Use deterministic seed based on builder index
      const seed = index;

      // Generate random total gems between 500-5000
      const totalGems = Math.floor(((seed % 45) + 5) * 100);

      // Generate random start week between W02-W10
      const weekNum = (seed % 9) + 2;
      const firstActiveWeek = `2025-W${weekNum.toString().padStart(2, '0')}`;

      return {
        id: `builder-${index}`,
        totalGems,
        firstActiveWeek
      };
    });

    const season = '2025-W02';
    const season = '2025-W02';
    const levels = calculateBuilderLevels({ season });
    expect(levels).toEqual([]);
  });
});
