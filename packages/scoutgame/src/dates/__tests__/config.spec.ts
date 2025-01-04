import { log } from '@charmverse/core/log';

import { getCurrentSeasonStart } from '../utils';

describe('season dates', () => {
  it('should return the correct season iso-week date', () => {
    const season = getCurrentSeasonStart('2025-W01');
    expect(season).toBe('2024-W41');

    const season2 = getCurrentSeasonStart('2025-W02');
    expect(season2).toBe('2025-W02');
  });
});
