import { log } from '@charmverse/core/log';

import { getCurrentSeasonStart } from '../utils';

describe('season dates', () => {
  it('should return the correct season iso-week date', () => {
    log.info(
      `This test is failing because we have modified the season list. Restore pre season 02 to start at 2025-W02 for this test to pass`
    );
    const season = getCurrentSeasonStart('2025-W01');
    expect(season).toBe('2024-W41');
  });
});
